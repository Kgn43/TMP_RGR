FROM python:3.13-slim

WORKDIR /app

COPY . .

RUN pip install \
    flask-sqlalchemy==3.1.1 \
    psycopg2-binary==2.9.10 \
    waitress==3.0.2 \
    requests==2.32.3\
    && pip cache purge

#RUN pip install flask flask-sqlalchemy psycopg2-binary requests waitress

CMD ["python", "-u", "main.py"]
