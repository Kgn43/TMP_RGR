from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text  
from werkzeug.middleware.proxy_fix import ProxyFix
import requests
from waitress import serve

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)


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


@app.route('/api/issues', methods=['POST'])
def create_issue():
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
        

if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=15000)
