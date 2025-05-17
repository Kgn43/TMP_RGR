from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text  
import requests

app = Flask(__name__)

# Подключение к PostgreSQL-БД
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://root:root@db:5432/root'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False 

db = SQLAlchemy(app)


@app.route('/api/departments', methods=['GET'])
def get_departments():
    try:
        query = text('SELECT id, "Name", "Floor" FROM departments ORDER BY "Floor"')
        result = db.session.execute(query)
        
        departments = []
        for row in result:
            departments.append({
                "id": row.id,
                "name": row.Name,
                "floor": row.Floor
            })
        
        return jsonify(departments)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/departments/<int:department_id>', methods=['GET'])
def get_department(department_id):
    try:
        query = text('''
            SELECT d.id, d."Name", d."Floor", 
                   e.id as employee_id, e."Name" as employee_name, e."Surname" as employee_surname
            FROM departments d
            LEFT JOIN employees e ON d."Responsible_employee_id" = e.id
            WHERE d.id = :id
        ''')
        result = db.session.execute(query, {'id': department_id})
        department = result.fetchone()
        
        if not department:
            return jsonify({"error": "Отдел не найден"}), 404
        
        response = {
            "id": department.id,
            "name": department.Name,
            "floor": department.Floor
        }
        
        if department.employee_id:
            response["responsible_employee"] = {
                "id": department.employee_id,
                "name": department.employee_name,
                "surname": department.employee_surname
            }
        
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
        
def get_employee_telegram_token(responsible_id: int) -> str:
    """Получает Telegram-токен ответственного сотрудника"""
    query = text('SELECT "Telegram" FROM employees WHERE id = :id')
    result = db.session.execute(query, {'id': responsible_id})
    employee = result.fetchone()
    return employee.Telegram if employee else None

@app.route('/api/issues', methods=['POST'])
def create_issue():
    try:
        data = request.get_json()
        
        # Проверяем обязательные поля
        required_fields = ['department_id', 'description']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Не хватает обязательных полей"}), 400
        
        # 1. Создаём запись о происшествии
        query = text('''
            INSERT INTO issues ("Department_id", "Status", "Description", "Created_at")
            VALUES (:department_id, 1, :description, CURRENT_TIMESTAMP)
            RETURNING id
        ''')
        result = db.session.execute(query, {
            'department_id': data['department_id'],
            'description': data['description']
        })
        db.session.commit()
        new_issue_id = result.fetchone()[0]
        
        # 2. Получаем данные для уведомления
        dept_query = text('''
            SELECT d."Name" as department_name, d."Floor", 
                   e."Telegram" as telegram_token
            FROM departments d
            JOIN employees e ON d."Responsible_employee_id" = e.id
            WHERE d.id = :dept_id
        ''')
        dept_result = db.session.execute(dept_query, {'dept_id': data['department_id']})
        dept_info = dept_result.fetchone()
        
        # 3. Отправляем уведомление в Telegram
        if dept_info and dept_info.telegram_token:
            notification_message = (
                f"Отдел: {dept_info.department_name} (Этаж {dept_info.Floor})\n"
                f"Описание: {data['description']}"
            )
            
            requests.post(
                "http://bot:15001/api/notify",
                json={
                    "chat_id": dept_info.telegram_token,
                    "message": notification_message
                },
                timeout=3
            )
        
        return jsonify({
            "id": new_issue_id,
            "message": "Происшествие зарегистрировано",
            "notification_sent": bool(dept_info and dept_info.telegram_token)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
        
        
#DEBUG


@app.route('/api/issues', methods=['GET'])
def debug_get_issues():
    try:
        # Простейший запрос без фильтрации
        result = db.session.execute(text('SELECT * FROM issues ORDER BY "Created_at" DESC'))
        
        # Конвертируем в список словарей
        issues = [dict(row._mapping) for row in result]
        
        # Конвертируем даты в строки
        for issue in issues:
            if 'Created_at' in issue:
                issue['Created_at'] = issue['Created_at'].isoformat()
        
        return jsonify(issues)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/employees', methods=['GET'])
def get_employees():
    try:
        query = text('SELECT id, "Name", "Surname" FROM employees')
        result = db.session.execute(query)
        
        employees = []
        for row in result:
            employees.append({
                "id": row.id,
                "name": row.Name,
                "surname": row.Surname
            })
        
        return jsonify(employees)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
        
@app.route('/api/employees/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):
    try:
        # Используем text() и именованный параметр :id для безопасного SQL-запроса
        query = text('SELECT id, "Name", "Surname", "Role", "Phone_number", "Login" FROM employees WHERE id = :id')
        result = db.session.execute(query, {'id': employee_id})
        employee = result.fetchone()  # Получаем одну запись
        
        if not employee:
            return jsonify({"error": "Сотрудник не найден"}), 404
        
        # Формируем ответ с данными сотрудника
        return jsonify({
            "id": employee.id,
            "name": employee.Name,
            "surname": employee.Surname,
            "role": employee.Role,
            "phone_number": employee.Phone_number,
            "login": employee.Login
            # Пароль не возвращаем никогда!
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Проверка подключения
@app.route('/')
def check_db():
    try:
        db.engine.connect()
        return "Подключение к БД успешно!"
    except Exception as e:
        return f"Ошибка подключения: {str(e)}"

if __name__ == '__main__':
    try:
        from waitress import serve
    except Exception as e:
        print(f"Ошибка импорта Waitress: {e}")
    serve(app, host="0.0.0.0", port=15000)
