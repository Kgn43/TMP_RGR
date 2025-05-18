заметки на будущее
1) Для проверки версии пакета для питона (в докерфайле) - pip index versions "name"
2) Для отладки api убрать из компоуз файла api и выбросить порт бд. Подключаться к 0.0.0.0. А на этапе, когда используются контейнеры вместо нулей указывается название сервиса.
3) ручной бэкап БД:
   a) sudo docker exec -ti db_postgres /bin/bash
   b) pg_dump --file "/home/backup.sql" --username "root" --no-password --format=p --encoding "UTF8" --inserts --column-inserts --verbose "root"
   c) sudo cat /var/lib/docker/volumes/kr_db_volume/_data/backup.sql > backup.sql
5) 
