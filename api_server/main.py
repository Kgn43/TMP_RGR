from flask import Flask, jsonify, request
from sqlalchemy import text  
from werkzeug.middleware.proxy_fix import ProxyFix
import requests
from waitress import serve
from models import db, Role, Employee, Department, Status, Issue
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import IntegrityError
import re
from werkzeug.security import generate_password_hash, check_password_hash

from flask_jwt_extended import JWTManager, create_access_token, set_access_cookies, jwt_required, unset_jwt_cookies, get_jwt_identity, get_jwt

from datetime import timedelta

import logging
import warnings
from sqlalchemy import exc as sa_exc
warnings.filterwarnings("ignore", category=sa_exc.LegacyAPIWarning)

from flask_cors import CORS

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1, x_for=1)
CORS(app) 


app.config["JWT_TOKEN_LOCATION"] = ["cookies"]  #токен ищем в куках
app.config["JWT_COOKIE_SECURE"] = False  # В разработке False, в продакшене True (если HTTPS)
app.config["JWT_COOKIE_HTTPONLY"] = True     #куки без JavaScript 
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_COOKIE_CSRF_PROTECT"] = True #Включаем CSRF защиту для кук
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://root:root@db:5432/root'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False 
app.config["JWT_SECRET_KEY"] = "aboba_aboba_aboba_aboba"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1) 
ADMIN_ROLE_ID = 1

db.init_app(app)
jwt = JWTManager(app)




ERROR_MESSAGES = {
    "INTERNAL_SERVER_ERROR": {
        "error_code": "INTERNAL_SERVER_ERROR",
        "message": "Произошла внутренняя ошибка сервера. Пожалуйста, попробуйте позже."
    },
    "VALIDATION_ERROR": {
        "error_code": "VALIDATION_ERROR",
        "message": "Ошибка валидации входных данных."
    },
    "BAD_REQUEST": {
        "error_code": "BAD_REQUEST",
        "message": "Некорректный запрос."
    },
    "CONFLICT": {
        "error_code": "CONFLICT",
        "message": "Конфликт данных. Ресурс уже существует."
    },
    "NOT_FOUND": {
        "error_code": "RESOURCE_NOT_FOUND",
        "message": "Запрашиваемый ресурс не найден."
    },
    "FORBIDDEN": {
        "error_code": "ACCESS_FORBIDDEN",
        "message": "Доступ запрещен. Недостаточно прав."
    },
    "JWT_UNAUTHORIZED_ACCESS": {
        "error_code": "UNAUTHORIZED_ACCESS",
        "message": "Отсутствует или неверно сформирован заголовок авторизации с Bearer токеном."
    },
    "JWT_INVALID_TOKEN": {
        "error_code": "INVALID_TOKEN",
        "message": "Предоставленный токен недействителен или поврежден." 
    },
    "JWT_TOKEN_EXPIRED": {
        "error_code": "TOKEN_EXPIRED",
        "message": "Срок действия токена истек. Пожалуйста, обновите токен или войдите заново."
    }
    
}


'''

ЛОГИ

'''


if not app.debug: # Настраиваем логирование для продакшена

    for handler in list(app.logger.handlers):
        app.logger.removeHandler(handler)

    app.logger.setLevel(logging.INFO) # Логируем INFO и выше
    app.logger.propagate = False

    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    app.logger.addHandler(stream_handler)


def _prepare_log_prefix(log_level_str="INFO"): #для отображения в сообщении
    
    ip_address = request.remote_addr

    method = getattr(request, 'method', 'UNKNOWN_METHOD')
    endpoint = getattr(request, 'path', 'UNKNOWN_ENDPOINT')
    
    return f"{log_level_str.upper()} {ip_address} {method} {endpoint}"



'''

ТОКЕНЫ

'''

@jwt.unauthorized_loader
def unauthorized_response(callback_reason_why_token_is_missing):
    log_prefix = _prepare_log_prefix("WARNING")
    log_message = f"{log_prefix} 401 - Unauthorized: {callback_reason_why_token_is_missing}"
    app.logger.warning(log_message)

    response_data = ERROR_MESSAGES.get("JWT_UNAUTHORIZED_ACCESS")
    return jsonify(response_data), 401

@jwt.invalid_token_loader
def invalid_token_response(callback_error_message):
    log_prefix = _prepare_log_prefix("WARNING")
    log_message = f"{log_prefix} 422 - Invalid Token: {callback_error_message}"
    app.logger.warning(log_message)
    
    response_data = ERROR_MESSAGES.get("JWT_INVALID_TOKEN")
    response_data_with_details = {**response_data, "details": str(callback_error_message)}
    return jsonify(response_data_with_details), 422

@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_payload):
    log_prefix = _prepare_log_prefix("INFO")
    user_id = jwt_payload.get('sub')
    log_message = f"{log_prefix} 401 - Expired Token for user ID: {user_id}"
    app.logger.info(log_message)
    
    response_data = ERROR_MESSAGES.get("JWT_TOKEN_EXPIRED")
    return jsonify(response_data), 401


@app.route('/api/login', methods=['POST'])
def login():
    log_prefix = _prepare_log_prefix("INFO") 
    data = request.get_json()
    if not data:
        app.logger.warning(f"{log_prefix.replace('INFO', 'WARNING')} 400 - Bad Request: Тело запроса пустое.")
        return jsonify({**ERROR_MESSAGES["BAD_REQUEST"], "details": "Тело запроса пустое."}), 400

    login = data.get('login')
    password = data.get('passwd')

    if not login or not password:
        app.logger.warning(f"{log_prefix.replace('INFO', 'WARNING')} 400 - Bad Request: Отсутствует логин или пароль")
        return jsonify({**ERROR_MESSAGES["BAD_REQUEST"], "details": "Необходимо указать логин и пароль."}), 400

    user = db.session.query(Employee).filter_by(login=login).first()

    if user and check_password_hash(user.passwd, password):
        additional_claims = {}
        if user.role_obj: 
            additional_claims["role_id"] = user.role_id
        
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        
        response_data = {
            "message": "Login successful",
            "user_id": str(user.id),
        }
        if "role_id" in additional_claims:
            response_data["role_id"] = additional_claims["role_id"]

        response = jsonify(response_data)
        set_access_cookies(response, access_token) # Установка JWT и CSRF токена в куки
        app.logger.info(f"{log_prefix} User {user.id} logged in successfully.")
        return response, 200
    else:
        app.logger.warning(f"{log_prefix} 401 - Unauthorized: Неверный пароль для пользователя: {login}.")
        return jsonify({**ERROR_MESSAGES.get("UNAUTHORIZED", {}), "details": "Неверный логин или пароль."}), 401

      
@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    log_prefix = _prepare_log_prefix("INFO")
    user_id = get_jwt_identity()
    app.logger.info(f"{log_prefix} User {user_id} logging out.")
    
    response_data = {"message": "Logout successful"}
    response = jsonify(response_data)
    unset_jwt_cookies(response)
    return response, 200


def check_user_role(required_roles_ids):
    claims = get_jwt()
    user_role_id = claims.get("role_id")
    if user_role_id is None or user_role_id not in required_roles_ids:
        return False
    return True


@app.route('/api/me', methods=['GET'])
@jwt_required() #Проверяет JWT из куки.
def get_me_route():
    current_user_id = get_jwt_identity()
    
    claims = get_jwt() 
    role_id = claims.get("role_id")

    user_data_for_frontend = {
        "user_id": current_user_id,
        "role_id": role_id
    }

    return jsonify(user_data_for_frontend), 200

    

'''

СОТРУДНИКИ

'''


@app.route('/api/employees', methods=['GET']) #получение списка сотрудников
@jwt_required()
def get_employees():
    if not check_user_role([ADMIN_ROLE_ID]):
        log_prefix = _prepare_log_prefix("WARNING")
        app.logger.warning(
            f"{log_prefix} 403 - Forbidden: Attempted to access admin-only employee list."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        
        employees_query = db.session.query(
            Employee.id,
            Employee.name,
            Employee.surname,
            Employee.login,
            Employee.role_id,
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
                "role_id": emp_data.role_id,
                "login": emp_data.login
            }
            result_employees.append(employee_dict)
        
        return jsonify(result_employees), 200

    except Exception as e:
        app.logger.error(
            f"{log_prefix} 500 - Exception in get_employees: {str(e)}")
        return jsonify(ERROR_MESSAGES["INTERNAL_SERVER_ERROR"]), 500
    

@app.route('/api/employees', methods=['POST']) #создание нового сотрудника
@jwt_required()
def new_employee():
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only employee add."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        data = request.get_json()
        if not data:
            app.logger.warning(f"{log_prefix} 400 - Bad Request: Тело запроса для создания сотрудника пустое.")
            return jsonify({
                **ERROR_MESSAGES["BAD_REQUEST"],
                "details": "Тело запроса не может быть пустым и должно содержать JSON."
            }), 400
    
        errors = {}
        #Проверяем, что поля не пустые
        required_fields = {
            "name": "Имя", "surname": "Фамилия", "role_id": "ID роли",
            "login": "Логин", "passwd": "Пароль",
            "phone_number": "Номер телефона", "telegram_id": "Telegram ID"
        }
        for field_key, field_name in required_fields.items():
            if not data.get(field_key):
                errors[field_key] = f"Поле '{field_name}' является обязательным и не может быть пустым."
        
        if errors:
            app.logger.warning(f"{log_prefix} 422 - Validation Error: Отсутствуют обязательные поля: {list(errors.keys())}.")
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422

        name = str(data['name']).strip()
        surname = str(data['surname']).strip()
        role_id_str = str(data['role_id']).strip()
        login = str(data['login']).strip()
        passwd = str(data['passwd'])
        phone_number = str(data['phone_number']).strip()
        telegram_id = str(data['telegram_id']).strip()
        
        #Валидация имени (кириллица, 1-20 символов)
        if not re.fullmatch(r"^[а-яА-ЯёЁ\s-]+$", name) or not (1 <= len(name) <= 20):
            errors["name"] = "Имя должно содержать только кириллицу (1-20 символов), пробелы или дефисы."
        
        #Валидация фамилии (кириллица, 1-20 символов)
        if not re.fullmatch(r"^[а-яА-ЯёЁ\s-]+$", surname) or not (1 <= len(surname) <= 20):
            errors["surname"] = "Фамилия должна содержать только кириллицу (1-20 символов), пробелы или дефисы."

        #Валидация логина (латиница, цифры, _, 1-30 символов, уникальный)
        if not re.fullmatch(r"^[a-zA-Z0-9_]+$", login) or not (1 <= len(login) <= 30):
            errors["login"] = "Логин должен содержать латиницу, цифры (1-30 символов)."
        elif db.session.query(Employee).filter_by(login=login).first(): # Проверка уникальности
            errors["login"] = "Пользователь с таким логином уже существует."
        
        #Валидация пароля (4-30 символов)
        if not (4 <= len(passwd) <= 30):
            errors["passwd"] = "Пароль должен быть от 4 до 30 символов."

        #Валидация номера телефона (Ровно 11 цифр, начинается на 89. НЕ УНИКАЛЕН.)
        if not re.fullmatch(r"^89\d{9}$", phone_number):
            errors["phone_number"] = "Номер телефона должен состоять ровно из 11 цифр и начинаться на '89'."

        #Валидация Telegram ID (Ровно 10 цифр. НЕ УНИКАЛЕН.)
        if not re.fullmatch(r"^\d{10}$", telegram_id):
            errors["telegram_id"] = "Telegram ID должен состоять ровно из 10 цифр."

        #Валидация ID Роли
        role_id = None
        try:
            role_id = int(role_id_str)
            if not db.session.query(Role).get(role_id):
                errors["role_id"] = f"Роль с ID {role_id} не найдена."
        except ValueError:
            errors["role_id"] = "ID роли должен быть целым числом."
        
        if errors:
            app.logger.warning(f"{log_prefix} 422 - Validation Error: Обнаружены ошибки в полях: {errors}.")
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422
        
        hashed_password = generate_password_hash(passwd)

        new_employee_obj = Employee(
            name=name, surname=surname, role_id=role_id,
            login=login, passwd=hashed_password,
            phone_number=phone_number, telegram_id=telegram_id
        )
        
        db.session.add(new_employee_obj)
        db.session.commit()

        role_name_for_response = new_employee_obj.role_obj.role_name if new_employee_obj.role_obj else None

        created_employee_data = {
            "id": new_employee_obj.id, "name": new_employee_obj.name, "surname": new_employee_obj.surname,
            "role_id": new_employee_obj.role_id, "role_name": role_name_for_response,
            "login": new_employee_obj.login, "phone_number": new_employee_obj.phone_number,
            "telegram_id": new_employee_obj.telegram_id
        }
        
        return jsonify(created_employee_data), 201

    except IntegrityError as e:
        db.session.rollback()
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 409/500 - IntegrityError in new_employee: {str(e.orig)}", 
            exc_info=True
        )
        error_detail = str(e.orig).lower()
        if "employees_login_key" in error_detail or ("unique constraint" in error_detail and "login" in error_detail):
            return jsonify({**ERROR_MESSAGES["CONFLICT"], "errors": {"login": "Пользователь с таким логином уже существует (ошибка БД)."}}), 409
        return jsonify(ERROR_MESSAGES["INTERNAL_SERVER_ERROR"]), 500
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(
            f"{log_prefix} 500 - Unhandled exception in new_employee: {str(e)}", 
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES["INTERNAL_SERVER_ERROR"]), 500


@app.route('/api/employees/<int:employee_id>', methods=['DELETE']) #удаление сотрудника
@jwt_required()
def delete_employee(employee_id):
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only employee deliting."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        #Находим сотрудника по ID
        employee = db.session.query(Employee).get(employee_id)

        if not employee:
            app.logger.warning(
                f"{log_prefix} 404 - Not Found: Employee with ID {employee_id} not found for deletion."
            )
            return jsonify({
                **ERROR_MESSAGES.get("NOT_FOUND", {"error_code": "NOT_FOUND", "message": "Ресурс не найден."}),
                "details": f"Сотрудник с ID {employee_id} не найден для удаления."
            }), 404

        #Перед удалением проверяем ответственнен ли сотрудник за отдел
        department_as_responsible = db.session.query(Department).filter_by(responsible_employee_id_fk=employee_id).first()
        if department_as_responsible:
            app.logger.warning(
                f"{log_prefix} 409 - Conflict (Deletion Restricted): Attempted to delete employee ID {employee_id} "
                f"who is responsible for department ID {department_as_responsible.id} ('{department_as_responsible.name}')."
            )
            return jsonify({
                "error_code": "DELETION_RESTRICTED",
                "message": "Нельзя удалить сотрудника, так как он является ответственным за отдел.",
                "department_id": department_as_responsible.id,
                "department_name": department_as_responsible.name
            }), 409

        db.session.delete(employee)
        db.session.commit()
        
        
        return jsonify({"message": f"Сотрудник с ID {employee_id} успешно удален."}), 200

    except IntegrityError as e: # Если удаление нарушает какие-то ограничения внешних ключей
        db.session.rollback()
        log_prefix_error = _prepare_log_prefix("ERROR")
        app.logger.error(
            f"{log_prefix_error} 409 - IntegrityError deleting employee ID {employee_id}: {str(e.orig)}",
            exc_info=True
        )
        
        return jsonify({
            **ERROR_MESSAGES.get("CONFLICT", {"error_code": "CONFLICT", "message": "Конфликт данных."}),
            "details": "Не удалось удалить сотрудника. Возможно, на него ссылаются другие записи (например, он ответственный за отдел)."
        }), 409

    except Exception as e:
        db.session.rollback()
        app.logger.error(
            f"{log_prefix_error} 500 - Unhandled exception deleting employee ID {employee_id}: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500


@app.route('/api/employees/<int:employee_id>', methods=['GET']) #получение полной информации о сотруднике
@jwt_required()
def get_employee_info(employee_id):
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only employee detail."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        # Пытаемся найти сотрудника и сразу загрузить информацию о его роли
        employee = db.session.query(Employee).options(
            joinedload(Employee.role_obj)
        ).get(employee_id)

        if not employee:
            app.logger.warning(
                f"{log_prefix} 404 - Not Found: Employee with ID {employee_id} not found."
            )
            return jsonify({
                **ERROR_MESSAGES.get("NOT_FOUND", {"error_code": "NOT_FOUND", "message": "Ресурс не найден."}), 
                "details": f"Сотрудник с ID {employee_id} не найден."
            }), 404

        # Формируем ответ
        employee_data = {
            "id": employee.id,
            "name": employee.name,
            "surname": employee.surname,
            "role_id": employee.role_id,
            "role_name": employee.role_obj.role_name if employee.role_obj else "Роль не найдена",
            "phone_number": employee.phone_number,
            "telegram_id": employee.telegram_id,
            "login": employee.login
        }
        
        return jsonify(employee_data), 200

    except Exception as e:
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 500 - Exception in get_employee_info for ID {employee_id}: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500


@app.route('/api/employees/<int:employee_id>', methods=['PUT']) #изменение данных сотрудника
@jwt_required()
def update_employee_info(employee_id):
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only employee edit."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        employee = db.session.query(Employee).get(employee_id)
        if not employee:
            app.logger.warning(
                f"{log_prefix} 404 - Not Found: Employee with ID {employee_id} not found for update."
            )
            return jsonify({
                **ERROR_MESSAGES.get("NOT_FOUND", {"error_code": "NOT_FOUND", "message": "Ресурс не найден."}),
                "details": f"Сотрудник с ID {employee_id} не найден."
            }), 404

        data = request.get_json()
        if not data:
            app.logger.warning(
                f"{log_prefix} 400 - Bad Request: Request body пустое для обновления сотрудника ID {employee_id}."
            )
            return jsonify({
                **ERROR_MESSAGES["BAD_REQUEST"],
                "details": "Тело запроса не может быть пустым и должно содержать JSON данные для обновления."
            }), 400

        errors = {}

        # Поля, которые МОЖНО изменять. Все они обязательны в запросе.
        updatable_required_fields = {
            "name": "Имя", "surname": "Фамилия", "role_id": "ID роли",
            "phone_number": "Номер телефона", "telegram_id": "Telegram ID"
        }
        for field_key, field_name in updatable_required_fields.items():
            value = data.get(field_key)
            if value is None or not str(value).strip():
                errors[field_key] = f"Поле '{field_name}' является обязательным и не может быть пустым в запросе."
        
        # Проверяем, что поля login и passwd не пытаются передать с целью изменения,
        # или просто информируем, что они будут проигнорированы.
        # Для простоты, мы их просто проигнорируем, если они есть в data.

        if errors:
            app.logger.warning(
                f"{log_prefix} 422 - Validation Error (Update Employee ID {employee_id}): "
                f"Отсутствуют обязательные поля: {list(errors.keys())}."
            )
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422

        # Извлечение данных (только изменяемых полей)
        name = str(data['name']).strip()
        surname = str(data['surname']).strip()
        role_id_str = str(data['role_id']).strip()
        phone_number = str(data['phone_number']).strip()
        telegram_id = str(data['telegram_id']).strip()

        # Валидация и обновление данных
        # Имя
        if not re.fullmatch(r"^[а-яА-ЯёЁ\s-]+$", name) or not (1 <= len(name) <= 20):
            errors["name"] = "Имя: кириллица (1-20 симв.), пробелы, дефисы."
        else:
            employee.name = name
        
        # Фамилия
        if not re.fullmatch(r"^[а-яА-ЯёЁ\s-]+$", surname) or not (1 <= len(surname) <= 20):
            errors["surname"] = "Фамилия: кириллица (1-20 симв.), пробелы, дефисы."
        else:
            employee.surname = surname

        # Номер телефона
        if not re.fullmatch(r"^89\d{9}$", phone_number):
            errors["phone_number"] = "Номер телефона: 11 цифр, начинается на '89'."
        else:
            employee.phone_number = phone_number

        # Telegram ID
        if not re.fullmatch(r"^\d{10}$", telegram_id):
            errors["telegram_id"] = "Telegram ID: 10 цифр."
        else:
            employee.telegram_id = telegram_id
        
        # ID Роли
        try:
            role_id = int(role_id_str)
            role_obj = db.session.query(Role).get(role_id)
            if not role_obj:
                errors["role_id"] = f"Роль с ID {role_id} не найдена."
            else:
                employee.role_id = role_id # Обновляем role_id
                employee.role_obj = role_obj # Также обновляем связанный объект для консистентности в сессии
        except ValueError:
            errors["role_id"] = "ID роли должен быть целым числом."
        
        if errors:
            app.logger.warning(
                f"{log_prefix} 422 - Validation Error (Update Employee ID {employee_id}): "
                f"Обнаружены ошибки в полях: {errors}."
            )
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422

        db.session.commit()

        db.session.refresh(employee)
        db.session.expire(employee, ['role_obj']) # Говорит SQLAlchemy, что 'role_obj' нужно перезагрузить при следующем доступе


        employee_data = {
            "id": employee.id,
            "name": employee.name,
            "surname": employee.surname,
            "role_id": employee.role_id,
            "role_name": employee.role_obj.role_name if employee.role_obj else None,
            "login": employee.login,
            "phone_number": employee.phone_number,
            "telegram_id": employee.telegram_id
        }
        
        return jsonify(employee_data), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 500 - Exception in update_employee_info for ID {employee_id}: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500



'''

ОТДЕЛЫ

'''



@app.route('/api/departments', methods=['GET'])#получение списка отделов
def get_departments():
    try:
        # Загружаем отделы и сразу информацию об ответственных сотрудниках
        departments_query = db.session.query(Department).options(
            joinedload(Department.responsible_employee).joinedload(Employee.role_obj)
        ).order_by(Department.floor, Department.name).all()

        result_departments = []
        for dept in departments_query:
            responsible_employee_info = None
            if dept.responsible_employee:
                responsible_employee_info = {
                    "id": dept.responsible_employee.id,
                    "name": dept.responsible_employee.name,
                    "surname": dept.responsible_employee.surname
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
        log_prefix = _prepare_log_prefix("ERROR")
        app.logger.error(
            f"{log_prefix} 500 - Exception in get_departments: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500
    

@app.route('/api/departments', methods=['POST']) #создание нового отдела
@jwt_required()
def new_department():
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only departments add."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        data = request.get_json()
        if not data:
            app.logger.warning(f"{log_prefix} 400 - Bad Request: Тело запроса для создания отдела пустое.")
            return jsonify({
                **ERROR_MESSAGES["BAD_REQUEST"],
                "details": "Тело запроса не может быть пустым и должно содержать JSON."
            }), 400

        errors = {}

        #Проверяем, что поля не пустые
        required_fields = {
            "name": "Название отдела",
            "floor": "Этаж",
            "responsible_employee_id": "ID ответственного сотрудника"
        }
        for field_key, field_name in required_fields.items():
            value = data.get(field_key)
            if value is None or (isinstance(value, str) and not value.strip()) or (isinstance(value, (int, float)) and value == 0 and field_key == 'floor'): # Добавил явную проверку на 0 для floor
                if field_key == 'floor' and value == 0: #Этаж 0 не может быть
                     errors[field_key] = f"Поле '{field_name}' не может быть 0."
                elif not value and value is not None and value !=0:
                     errors[field_key] = f"Поле '{field_name}' не может быть пустым."
                elif value is None:
                     errors[field_key] = f"Поле '{field_name}' является обязательным."


        if errors:
            app.logger.warning(f"{log_prefix} 422 - Validation Error: Отсутствуют обязательные поля: {list(errors.keys())}.")
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422

        name = str(data['name']).strip()
        floor_str = str(data['floor']).strip()
        responsible_employee_id_str = str(data['responsible_employee_id']).strip()

        #Валидация названия отдела (кириллица, латиница, спецсимволы, 1-50 символов)
        if not (1 <= len(name) <= 50):
            errors["name"] = "Название отдела должно быть от 1 до 50 символов."

        #Валидация этажей (число от 1 до 3)
        floor = None
        try:
            floor = int(floor_str)
            if not (1 <= floor <= 3):
                errors["floor"] = "Этаж должен быть числом от 1 до 3."
        except ValueError:
            errors["floor"] = "Этаж должен быть целым числом."

        #Валидация ID ответственного сотрудника
        responsible_employee_id = None
        try:
            responsible_employee_id = int(responsible_employee_id_str)
            if not db.session.query(Employee).get(responsible_employee_id):
                errors["responsible_employee_id"] = f"Сотрудник с ID {responsible_employee_id} не найден."
        except ValueError:
            errors["responsible_employee_id"] = "ID ответственного сотрудника должен быть целым числом."
        
        if errors:
            app.logger.warning(f"{log_prefix} 422 - Validation Error: Обнаружены ошибки в полях: {errors}.")
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422

        #Создание нового отдела
        new_department_obj = Department(
            name=name,
            floor=floor,
            responsible_employee_id_fk=responsible_employee_id
        )
        
        db.session.add(new_department_obj)
        db.session.commit()

        responsible_employee_name = None
        if new_department_obj.responsible_employee:
            responsible_employee_name = f"{new_department_obj.responsible_employee.name} {new_department_obj.responsible_employee.surname}"


        created_department_data = {
            "id": new_department_obj.id,
            "name": new_department_obj.name,
            "floor": new_department_obj.floor,
            "responsible_employee_id": new_department_obj.responsible_employee_id_fk,
            "responsible_employee_name": responsible_employee_name
        }
        
        return jsonify(created_department_data), 201

        
    except Exception as e:
        db.session.rollback()
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 500 - Exception in new_department: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES["INTERNAL_SERVER_ERROR"]), 500


@app.route('/api/departments/<int:department_id>', methods=['DELETE']) #удаление отдела
@jwt_required()
def delete_department(department_id):
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only departments del."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        department = db.session.query(Department).get(department_id)

        if not department:
            app.logger.warning(
                f"{log_prefix} 404 - Not Found: Department with ID {department_id} not found for deletion."
            )
            return jsonify({
                **ERROR_MESSAGES.get("NOT_FOUND", {"error_code": "NOT_FOUND", "message": "Ресурс не найден."}),
                "details": f"Отдел с ID {department_id} не найден для удаления."
            }), 404

        #Проверка, есть ли связанные происшествия
        related_issue = db.session.query(Issue).filter_by(department_id_fk=department_id).first()
        if related_issue:
            app.logger.warning(
                f"{log_prefix} 409 - Conflict (Deletion Restricted): Attempted to delete department ID {department_id} "
                f"which is linked to issue ID {related_issue.id}."
            )
            return jsonify({
                "error_code": "DELETION_RESTRICTED",
                "message": "Нельзя удалить отдел, так как с ним связаны происшествия.",
                "related_issue_id_example": related_issue.id
            }), 409

        db.session.delete(department)
        db.session.commit()
        
        return jsonify({"message": f"Отдел с ID {department_id} успешно удален."}), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 500 - Unhandled exception deleting department ID {department_id}: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500


@app.route('/api/departments/<int:department_id>', methods=['GET']) #получение полной информации об отделе
@jwt_required()
def get_department_info(department_id):
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only departments ditails."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        department = db.session.query(Department).options(
            joinedload(Department.responsible_employee).joinedload(Employee.role_obj), #Загружаем ответственного и его роль
        ).get(department_id)

        if not department:
            app.logger.warning(
                f"{log_prefix} 404 - Not Found: Department with ID {department_id} not found."
            )
            return jsonify({
                **ERROR_MESSAGES.get("NOT_FOUND", {"error_code": "NOT_FOUND", "message": "Ресурс не найден."}), 
                "details": f"Отдел с ID {department_id} не найден."
            }), 404

        responsible_employee_info = None
        if department.responsible_employee:
            responsible_employee_info = {
                "id": department.responsible_employee.id,
                "name": department.responsible_employee.name,
                "surname": department.responsible_employee.surname,
                "login": department.responsible_employee.login
            }

        department_data = {
            "id": department.id,
            "name": department.name,
            "floor": department.floor,
            "responsible_employee": responsible_employee_info
        }
        
        return jsonify(department_data), 200

    except Exception as e:
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 500 - Exception in get_department_info for ID {department_id}: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500


@app.route('/api/departments/<int:department_id>', methods=['PUT']) #изменение данных отдела
@jwt_required()
def update_department_info(department_id):
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only departments update."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        department = db.session.query(Department).get(department_id)
        if not department:
            app.logger.warning(
                f"{log_prefix} 404 - Not Found: Department with ID {department_id} not found for update."
            )
            return jsonify({
                **ERROR_MESSAGES.get("NOT_FOUND", {"error_code": "NOT_FOUND", "message": "Ресурс не найден."}),
                "details": f"Отдел с ID {department_id} не найден."
            }), 404

        data = request.get_json()
        if not data:
            app.logger.warning(
                f"{log_prefix} 400 - Bad Request: Request body пустое для обновления отдела ID {department_id}."
            )
            return jsonify({
                **ERROR_MESSAGES["BAD_REQUEST"],
                "details": "Тело запроса не может быть пустым и должно содержать JSON данные для обновления."
            }), 400

        errors = {}

        #Проверяем, что поля не пустые
        required_fields_in_request = {
            "name": "Название отдела",
            "floor": "Этаж",
            "responsible_employee_id": "ID ответственного сотрудника"
        }
        for field_key, field_name in required_fields_in_request.items():
            value = data.get(field_key)
            if value is None or (isinstance(value, str) and not value.strip()) or (isinstance(value, (int, float)) and value == 0 and field_key == 'floor'):
                if field_key == 'floor' and value == 0:
                     errors[field_key] = f"Поле '{field_name}' не может быть 0."
                elif not value and value is not None and value !=0 :
                     errors[field_key] = f"Поле '{field_name}' не может быть пустым."
                elif value is None:
                     errors[field_key] = f"Поле '{field_name}' является обязательным."


        if errors:
            app.logger.warning(
                f"{log_prefix} 422 - Validation Error (Update Department ID {department_id}): "
                f"Отсутствуют обязательные поля: {list(errors.keys())}."
            )
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422

        
        name = str(data['name']).strip()
        floor_str = str(data['floor']).strip()
        responsible_employee_id_str = str(data['responsible_employee_id']).strip()

        #Валидация названия отдела
        if not (1 <= len(name) <= 50):
            errors["name"] = "Название отдела должно быть от 1 до 50 символов."
        else:
            department.name = name
        
        #Валидация этажа
        try:
            floor = int(floor_str)
            if not (1 <= floor <= 3):
                errors["floor"] = "Этаж должен быть числом от 1 до 3."
            else:
                department.floor = floor
        except ValueError:
            errors["floor"] = "Этаж должен быть целым числом."

        #Валидация ID ответственного сотрудника
        try:
            responsible_employee_id = int(responsible_employee_id_str)
            responsible_employee_obj = db.session.query(Employee).get(responsible_employee_id)
            if not responsible_employee_obj:
                errors["responsible_employee_id"] = f"Сотрудник с ID {responsible_employee_id} не найден."
            else:
                department.responsible_employee_id_fk = responsible_employee_id
                department.responsible_employee = responsible_employee_obj
        except ValueError:
            errors["responsible_employee_id"] = "ID ответственного сотрудника должен быть целым числом."
        
        if errors:
            app.logger.warning(
                f"{log_prefix} 422 - Validation Error (Update Department ID {department_id}): "
                f"Обнаружены ошибки в полях: {errors}."
            )
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422

        db.session.commit()

        updated_department = db.session.query(Department).options(
            joinedload(Department.responsible_employee).joinedload(Employee.role_obj)
        ).get(department_id)


        responsible_employee_info = None
        if updated_department.responsible_employee:
            responsible_employee_info = {
                "id": updated_department.responsible_employee.id,
                "name": updated_department.responsible_employee.name,
                "surname": updated_department.responsible_employee.surname,
            }

        department_data = {
            "id": updated_department.id,
            "name": updated_department.name,
            "floor": updated_department.floor,
            "responsible_employee_id": updated_department.responsible_employee_id_fk,
            "responsible_employee": responsible_employee_info
        }
        
        return jsonify(department_data), 200

        
    except Exception as e:
        db.session.rollback()
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 500 - Unhandled exception updating department ID {department_id}: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500


'''

ПРОИСШЕСТВИЯ

'''

@app.route('/api/issues', methods=['GET']) #получение списка происшествий
@jwt_required()
def get_issues():
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only issues get."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        issues_query = db.session.query(Issue).options(
            joinedload(Issue.status_obj), # Статус происшествия
            joinedload(Issue.department)  # Отдел, к которому относится происшествие
                .joinedload(Department.responsible_employee) # Ответственный сотрудник этого отдела
        ).order_by(Issue.created_at.desc()).all()

        result_issues = []
        for issue in issues_query:
            department_info = None
            responsible_employee_info = None
            if issue.department:
                department_info = {
                    "id": issue.department.id,
                    "name": issue.department.name
                }
                if issue.department.responsible_employee:
                    responsible_employee = issue.department.responsible_employee
                    responsible_employee_info = {
                        "id": responsible_employee.id,
                        "name": responsible_employee.name,
                        "surname": responsible_employee.surname,
                        "login": responsible_employee.login,
                    }
            
            status_info = None
            if issue.status_obj:
                status_info = {
                    "id": issue.status_obj.id,
                    "name": issue.status_obj.status_name
                }
            
            issue_data = {
                "id": issue.id,
                "department": department_info,
                "created_at": issue.created_at.isoformat() if issue.created_at else None,
                "status": status_info,
                "description": issue.description,
                "responsible_employee": responsible_employee_info
            }
            result_issues.append(issue_data)
        
        return jsonify(result_issues), 200

    except Exception as e:
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 500 - Exception in get_issues: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500


@app.route('/api/issues', methods=['POST']) #регистрация инцидента
def new_issue():
    try:
        log_prefix = _prepare_log_prefix("WARNING")
        data = request.get_json()
        if not data:
            app.logger.warning(f"{log_prefix} 400 - Bad Request: Тело запроса для регистрации происшествия пустое.")
            return jsonify({
                **ERROR_MESSAGES["BAD_REQUEST"],
                "details": "Тело запроса не может быть пустым и должно содержать JSON."
            }), 400

        errors = {}

        #Проверяем, что поля не пустые
        required_fields = {
            "department_id": "ID отдела",
            "description": "Описание происшествия"
        }
        for field_key, field_name in required_fields.items():
            value = data.get(field_key)
            if value is None or (isinstance(value, str) and not value.strip()):
                errors[field_key] = f"Поле '{field_name}' является обязательным и не может быть пустым."
        
        if errors:
            app.logger.warning(f"{log_prefix} 422 - Validation Error: Отсутствуют обязательные поля: {list(errors.keys())}.")
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422

        department_id_str = str(data['department_id']).strip()
        description = str(data['description']).strip()

        #Валидация ID отдела (должен существовать)
        department_id = None
        department_obj = None
        try:
            department_id = int(department_id_str)
            
            department_obj = db.session.query(Department).options(
                joinedload(Department.responsible_employee)
            ).get(department_id)
            if not department_obj:
                errors["department_id"] = f"Отдел с ID {department_id} не найден."
        except ValueError:
            errors["department_id"] = "ID отдела должен быть целым числом."

        #Валидация описания
        if not (1 <= len(description) <= 100):
            errors["description"] = "Описание происшествия должно быть от 1 до 100 символов."
        
        default_status_id = 1 #Новое проишествие
        status_obj = db.session.query(Status).get(default_status_id)

        if errors:
            app.logger.warning(f"{log_prefix} 422 - Validation Error: Обнаружены ошибки в полях: {errors}.")
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422

        
        # Created_at будет установлено автоматически, если в модели есть server_default=func.now()
        new_issue_obj = Issue(
            department_id_fk=department_obj.id, # или department=department_obj
            status_id_fk=status_obj.id,       # или status_obj=status_obj
            description=description
        )
        
        db.session.add(new_issue_obj)
        db.session.commit() # Получаем ID после коммита

        # 4. Отправка уведомления в Telegram
        notification_sent = False
        if department_obj and department_obj.responsible_employee and department_obj.responsible_employee.telegram_id:
            responsible_employee = department_obj.responsible_employee
            
            notification_message = (
                f"Новое происшествие ID: {new_issue_obj.id}\n"
                f"Отдел: {department_obj.name} (Этаж {department_obj.floor})\n"
                f"Описание: {description}"
            )
            
            try:
                bot_url = "http://bot:15001/api/notify"
                response = requests.post(
                    bot_url,
                    json={
                        "chat_id": responsible_employee.telegram_id, 
                        "message": notification_message
                    },
                    timeout=5 # Увеличил таймаут на всякий случай
                )
                if response.status_code == 200:
                    notification_sent = True
                else:
                    app.logger.error(
                        f"{_prepare_log_prefix('ERROR')} 500 - Error sending Telegram notification for issue ID {new_issue_obj.id}: "
                        f"Bot responded with {response.status_code} - {response.text}"
                    )
            except requests.exceptions.RequestException as e_req:
                # Логируем ошибку сети/подключения к боту
                app.logger.error(
                    f"{_prepare_log_prefix('ERROR')} 500 - Network error sending Telegram notification for issue ID {new_issue_obj.id}: {e_req}"
                )
        
    
        
        return jsonify({}), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 500 - Unhandled exception in new_issue: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES["INTERNAL_SERVER_ERROR"]), 500
        

@app.route('/api/issues/<int:issue_id>', methods=['PUT']) #изменение статуса инцидента
@jwt_required()
def update_issue_status(issue_id):
    log_prefix = _prepare_log_prefix("WARNING")
    if not check_user_role([ADMIN_ROLE_ID]):
        app.logger.warning(
        f"{log_prefix} 403 - Forbidden: Attempted to access admin-only issues upd."
        )
        return jsonify({**ERROR_MESSAGES.get("FORBIDDEN", {}), "details": "Доступ запрещен."}), 403
    try:
        issue = db.session.query(Issue).get(issue_id)
        if not issue:
            app.logger.warning(
                f"{log_prefix} 404 - Not Found: Issue with ID {issue_id} not found for status update."
            )
            return jsonify({
                **ERROR_MESSAGES.get("NOT_FOUND", {"error_code": "NOT_FOUND", "message": "Ресурс не найден."}),
                "details": f"Происшествие с ID {issue_id} не найдено."
            }), 404

        data = request.get_json()
        if not data:
            app.logger.warning(
                f"{log_prefix} 400 - Bad Request: Request body пустое для обновления статуса issue ID {issue_id}."
            )
            return jsonify({
                **ERROR_MESSAGES["BAD_REQUEST"],
                "details": "Тело запроса не может быть пустым и должно содержать JSON."
            }), 400

        errors = {}

        #Проверка наличия new_status_id
        new_status_id_str = data.get("new_status_id")
        if new_status_id_str is None or not str(new_status_id_str).strip():
            errors["new_status_id"] = "Поле 'new_status_id' является обязательным и не может быть пустым."
        

        #Валидация new_status_id
        new_status_id = None
        new_status_obj = None
        try:
            new_status_id = int(str(new_status_id_str).strip())
            new_status_obj = db.session.query(Status).get(new_status_id)
            if not new_status_obj:
                errors["new_status_id"] = f"Статус с ID {new_status_id} не найден."
        except ValueError:
            errors["new_status_id"] = "ID нового статуса должен быть целым числом."

        if errors:
            return jsonify({**ERROR_MESSAGES["VALIDATION_ERROR"], "errors": errors}), 422
        
        issue.status_id_fk = new_status_obj.id #Обновляем

        db.session.commit()
  
        updated_issue_data = {
            "message": "Статус происшествия успешно обновлен."
        }
        
        return jsonify(updated_issue_data), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(
            f"{log_prefix.replace('WARNING','ERROR')} 500 - Unhandled exception updating status for issue ID {issue_id}: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500



'''

СТАТУСЫ

'''

@app.route('/api/statuses/', methods=['GET']) #получить список статусов
def get_statuses():
    try:
        statuses_query = db.session.query(Status).order_by(Status.id).all()

        result_statuses = []
        for status_item in statuses_query:
            status_data = {
                "id": status_item.id,
                "name": status_item.status_name
            }
            result_statuses.append(status_data)
        
        return jsonify(result_statuses), 200

    except Exception as e:
        log_prefix = _prepare_log_prefix("ERROR")
        app.logger.error(
            f"{log_prefix} 500 - Unhandled exception in get_statuses: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {"error": "Internal server error"})), 500


@app.route('/api/roles', methods=['GET'])
def get_roles():
    try:
        roles_query = db.session.query(Role).order_by(Role.role_name).all()

        result_roles = []
        for role_item in roles_query:
            role_data = {
                "id": role_item.id,
                "name": role_item.role_name 
            }
            result_roles.append(role_data)

        return jsonify(result_roles), 200

    except Exception as e:

        log_prefix_error = _prepare_log_prefix("ERROR")
        app.logger.error(
            f"{log_prefix_error} 500 - Exception in get_roles: {str(e)}",
            exc_info=True
        )
        return jsonify(ERROR_MESSAGES.get("INTERNAL_SERVER_ERROR", {})), 500

if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=15000)
