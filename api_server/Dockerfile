FROM python:3.13-slim

WORKDIR /app

COPY . .

RUN pip install \
    flask-sqlalchemy==3.1.1 \
    psycopg2-binary==2.9.10 \
    waitress==3.0.2 \
    requests==2.32.3 \
    werkzeug==3.1.3 \
    Flask-JWT-Extended \
    && pip cache purge

CMD ["python", "-u", "main.py"]
