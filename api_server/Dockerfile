FROM python:3

WORKDIR /app

COPY . .

RUN pip install flask flask-sqlalchemy psycopg2-binary

CMD ["python", "-u", "main.py"]
