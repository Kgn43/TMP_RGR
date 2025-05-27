from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func

db = SQLAlchemy()

class Role(db.Model):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column("Role", db.String(20), nullable=False, unique=True)

    # Связь: одна роль может быть у многих сотрудников
    employees = db.relationship('Employee', back_populates='role_obj', lazy='dynamic')

    def __repr__(self):
        return f'<Role {self.role_name}>'

class Employee(db.Model):
    __tablename__ = 'employees'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column("Name", db.String(20), nullable=False)
    surname = db.Column("Surname", db.String(20), nullable=False)
    role_id = db.Column("Role", db.Integer, db.ForeignKey('roles.id'), nullable=False)
    phone_number = db.Column("Phone_number", db.String(20), nullable=True)
    telegram_id = db.Column("Telegram_id", db.String(20), nullable=True)
    login = db.Column("Login", db.String(50), nullable=False, unique=True)
    passwd = db.Column("Passwd", db.Text, nullable=False)

    # Связь: сотрудник имеет одну роль
    role_obj = db.relationship('Role', back_populates='employees')
    
    # Связь: сотрудник может быть ответственным за несколько отделов
    # `foreign_keys` здесь нужен, чтобы SQLAlchemy знала, какое поле в Department использовать для этой связи
    departments_responsible_for = db.relationship('Department', 
                                                  foreign_keys='Department.responsible_employee_id_fk', 
                                                  back_populates='responsible_employee', 
                                                  lazy='dynamic')

    def __repr__(self):
        return f'<Employee {self.name} {self.surname}>'

class Department(db.Model):
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column("Name", db.String(50), nullable=False)
    floor = db.Column("Floor", db.Integer, nullable=False)
    responsible_employee_id_fk = db.Column("Responsible_employee_id", db.Integer, db.ForeignKey('employees.id'), nullable=False)

    # Связь: у отдела один ответственный сотрудник
    responsible_employee = db.relationship('Employee', 
                                           foreign_keys=[responsible_employee_id_fk], 
                                           back_populates='departments_responsible_for')
    
    # Связь: в одном отделе может быть много происшествий
    issues = db.relationship('Issue', back_populates='department', lazy='dynamic')

    def __repr__(self):
        return f'<Department {self.name}>'

class Status(db.Model):
    __tablename__ = 'statuses'

    id = db.Column(db.Integer, primary_key=True)
    status_name = db.Column("Status", db.String(20), nullable=False, unique=True)

    # Связь: один статус может быть у многих происшествий
    issues = db.relationship('Issue', back_populates='status_obj', lazy='dynamic')

    def __repr__(self):
        return f'<Status {self.status_name}>'

class Issue(db.Model):
    __tablename__ = 'issues'

    id = db.Column(db.Integer, primary_key=True) 
    department_id_fk = db.Column("Department_id", db.Integer, db.ForeignKey('departments.id'), nullable=False)
    created_at = db.Column("Created_at", db.DateTime, nullable=False, server_default=func.now())
    status_id_fk = db.Column("Status", db.Integer, db.ForeignKey('statuses.id'), nullable=False)
    description = db.Column("Description", db.String(100), nullable=False)

    # Связь: происшествие принадлежит одному отделу
    department = db.relationship('Department', foreign_keys=[department_id_fk], back_populates='issues')
    
    # Связь: происшествие имеет один статус
    status_obj = db.relationship('Status', foreign_keys=[status_id_fk], back_populates='issues')

    def __repr__(self):
        return f'<Issue ID: {self.id} in Dept: {self.department_id_fk}>'