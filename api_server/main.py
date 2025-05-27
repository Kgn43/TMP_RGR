from flask import Flask, jsonify, request
from sqlalchemy import text  
from werkzeug.middleware.proxy_fix import ProxyFix
import requests
from waitress import serve
from models import db, Role, Employee, Department, Status, Issue
from sqlalchemy.orm import joinedload

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)


app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://root:root@db:5432/root'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False 

db.init_app(app)


ERROR_MESSAGES = {
    "INTERNAL_SERVER_ERROR": {
        "error_code": "INTERNAL_SERVER_ERROR",
        "message": "Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже."
    },
    
}



'''

СОТРУДНИКИ

'''


@app.route('/api/employees', methods=['GET']) #получение списка сотрудников
def get_employees():
    try:
        # Используем join для объединения таблиц и options(joinedload()) для эффективной загрузки ролей
        # employees_query = db.session.query(Employee).options(db.joinedload(Employee.role)).all()
        
        employees_query = db.session.query(
            Employee.id,
            Employee.name,
            Employee.surname,
            Employee.phone_number,
            Employee.telegram_id,
            Employee.login,
            Role.role_name
        ).join(Role, Employee.role_id == Role.id).all()


        if not employees_query:
            return jsonify([]), 200

        result_employees = []
        for emp_data in employees_query:
            employee_dict = {
                "id": emp_data.id,
                "name": emp_data.name,
                "surname": emp_data.surname,
                "role": emp_data.role_name,
                "phone_number": emp_data.phone_number,
                "telegram_id": emp_data.telegram_id,
                "login": emp_data.login
            }
            result_employees.append(employee_dict)
        
        return jsonify(result_employees), 200

    except Exception as e:
        # Логирование ошибки (в реальном приложении)
        # app.logger.error(f"Error in get_employees: {str(e)}")
        print(f"Error in get_employees: {str(e)}") # Для отладки, если логгер не настроен
        return jsonify(ERROR_MESSAGES["INTERNAL_SERVER_ERROR"]), 500
    

@app.route('/api/employees', methods=['POST']) #создание нового сотрудника
def new_employee():
    return


@app.route('/api/employees/<int:employee_id>', methods=['DELETE']) #удаление сотрудника
def delete_employee(employee_id):
    return


@app.route('/api/employees/<int:employee_id>', methods=['GET']) #получение полной информации о сотруднике
def get_employee_info(employee_id):
    return


@app.route('/api/employees/<int:employee_id>', methods=['PUT']) #изменение данных сотрудника
def update_employee_info(employee_id):
    return



'''

ОТДЕЛЫ

'''



@app.route('/api/departments', methods=['GET'])#получение списка отделов
def get_departments():
    try:
        # Загружаем отделы и сразу информацию об ответственных сотрудниках
        # Используем joinedload для одного запроса к БД (LEFT JOIN)
        departments_query = db.session.query(Department).options(
            joinedload(Department.responsible_employee).joinedload(Employee.role_obj) # Также загружаем роль ответственного, если нужно
        ).order_by(Department.floor, Department.name).all() # Пример сортировки

        result_departments = []
        for dept in departments_query:
            responsible_employee_info = None
            if dept.responsible_employee:
                responsible_employee_info = {
                    "id": dept.responsible_employee.id,
                    "name": dept.responsible_employee.name,
                    "surname": dept.responsible_employee.surname,
                    "login": dept.responsible_employee.login,
                    "role": dept.responsible_employee.role_obj.role_name if dept.responsible_employee.role_obj else None
                }
            
            department_data = {
                "id": dept.id,
                "name": dept.name,
                "floor": dept.floor,
                "responsible_employee": responsible_employee_info
                # Можно добавить и другие поля отдела, если они есть в модели
            }
            result_departments.append(department_data)
        
        return jsonify(result_departments), 200
    except Exception as e:
        # В реальном приложении используйте app.logger.error(f"Error in get_departments: {str(e)}")
        print(f"Error in get_departments: {str(e)}") # Для отладки
        # Возвращаем стандартизированное сообщение об ошибке
        # Убедитесь, что ERROR_MESSAGES определены глобально
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500
    

@app.route('/api/departments', methods=['POST']) #создание нового отдела
def new_department():
    return


@app.route('/api/departments/<int:department_id>', methods=['DELETE']) #удаление отдела
def delete_department(department_id):
    return


@app.route('/api/departments/<int:department_id>', methods=['GET']) #получение полной информации об отделе
def get_department_info(department_id):
    return


@app.route('/api/departments/<int:department_id>', methods=['PUT']) #изменение данных отдела
def update_department_info(department_id):
    return


'''

ПРОИСШЕСТВИЯ

'''

@app.route('/api/issues', methods=['GET']) #получение списка происшествий
def get_issues():
    try:
        # Загружаем происшествия и сразу информацию об отделах и статусах
        issues_query = db.session.query(Issue).options(
            joinedload(Issue.department),  # Загрузка связанного отдела
            joinedload(Issue.status_obj)   # Загрузка связанного статуса
        ).order_by(Issue.created_at.desc()).all() # Пример сортировки: сначала новые

        result_issues = []
        for issue in issues_query:
            department_info = None
            if issue.department:
                department_info = {
                    "id": issue.department.id,
                    "name": issue.department.name
                }
            
            status_info = None
            if issue.status_obj:
                status_info = {
                    "id": issue.status_obj.id,
                    "name": issue.status_obj.status_name # Используем 'status_name' из модели Status
                }
            
            issue_data = {
                "id": issue.id,
                "department": department_info,
                "created_at": issue.created_at.isoformat() if issue.created_at else None,
                "status": status_info,
                "description": issue.description
            }
            result_issues.append(issue_data)
        
        return jsonify(result_issues), 200

    except Exception as e:
        # В реальном приложении используйте app.logger.error(f"Error in get_issues: {str(e)}")
        print(f"Error in get_issues: {str(e)}") # Для отладки
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500


@app.route('/api/issues', methods=['POST']) #регистрация инцидента
def new_issue():
    try:
        data = request.get_json()
        
        # Проверяем обязательные поля
        required_fields = ['department_id', 'description']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Не хватает обязательных полей"}), 400
        
        #Создаём запись о происшествии
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
        
        #Получаем данные для уведомления
        dept_query = text('''
            SELECT d."Name" as department_name, d."Floor", 
                   e."Telegram" as telegram_token
            FROM departments d
            JOIN employees e ON d."Responsible_employee_id" = e.id
            WHERE d.id = :dept_id
        ''')
        dept_result = db.session.execute(dept_query, {'dept_id': data['department_id']})
        dept_info = dept_result.fetchone()
        
        #Отправляем уведомление в Telegram
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
        

@app.route('/api/issues/<int:issue_id>', methods=['PUT']) #изменение статуса инцидента
def update_issue_status(issue_id):
    return




if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=15000)
