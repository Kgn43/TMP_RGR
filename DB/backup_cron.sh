#!/bin/bash

# Конфигурационные переменные
BACKUP_DIR="/opt/backups/postgres" # Директория на хосте для хранения бэкапов
DB_CONTAINER_NAME="db_postgres"    # Имя твоего Docker контейнера с PostgreSQL
DB_USER="root"
DB_NAME="root"
MAX_HOURLY_BACKUPS=24              # Количество часовых бэкапов, которые мы хотим хранить

# Создаем директорию для бэкапов, если она не существует
mkdir -p "${BACKUP_DIR}"

CURRENT_HOUR_NUM=$(date +%H) # 00-23
# Преобразуем в 1-24 (00 становится 24-м часом предыдущего дня, но для простоты сделаем 00 -> 24)
if [ "$CURRENT_HOUR_NUM" -eq "00" ]; then
    BACKUP_NUMBER=24
else
    # Убираем ведущий ноль, если он есть, для часов 01-09
    BACKUP_NUMBER=$(echo $CURRENT_HOUR_NUM | sed 's/^0*//') 
fi
BACKUP_FILENAME="backup${BACKUP_NUMBER}.sql.gz" # Добавляем .gz для сжатия

TARGET_FILE_ON_HOST="${BACKUP_DIR}/${BACKUP_FILENAME}"

# Команда pg_dump внутри контейнера, вывод сразу направляем на хост и сжимаем
echo "Starting backup for hour ${BACKUP_NUMBER}..."
sudo docker exec "${DB_CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-password --format=c --blobs --encoding "UTF8" --verbose | gzip > "${TARGET_FILE_ON_HOST}"

# Проверяем успешность создания бэкапа
if [ $? -eq 0 ]; then
  echo "Backup ${TARGET_FILE_ON_HOST} created successfully."


else
  echo "ERROR: Backup ${TARGET_FILE_ON_HOST} failed."
  exit 1
fi

echo "Backup process finished."
exit 0