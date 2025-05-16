#!/bin/bash

sudo docker exec -ti db_postgres /bin/bash

pg_dump --file "/home/backup.sql" --username "root" --no-password --format=p --encoding "UTF8" --inserts --column-inserts --verbose "root"

exit

sudo cat /var/lib/docker/volumes/kr_db_volume/_data/backup.sql > backup.sql