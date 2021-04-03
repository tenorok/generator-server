#!/bin/bash

set -e

# Если указано имя дампа, значит нужно восстановить БД из него.
if [[ $DUMP_NAME ]]; then
    # Подписываемся на доступность порта монги и
    # запускаем процесс восстановления с заменой существующих коллекций.
    nohup sh -c '''
        WAIT_HOSTS=localhost:27017 /root/wait && \
        mongorestore --drop --gzip --archive=/root/backup/$DUMP_NAME
    ''' > /root/mongorestore.out &
fi

mongod --smallfiles --bind_ip_all
