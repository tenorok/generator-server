# <%= project %>

Для использования команды `task` в `$PATH` должен быть добавлен путь `./bin`.

# Разработка без контейнеров

Запуск с отслеживанием изменения файлов: `task start:watch`.

# Docker:Development

- первая вкладка: `task docker:compose:dev --build`
- вторая вкладка: `tsc -p app/tsconfig.json -w`

Авторизоваться в реестре: `docker login registry.gitlab.com`.

Посмотреть информацию о контейнере: `docker inspect <%= project %>`.

Зайти в контейнер: `docker exec -it <%= project %> /bin/sh`.

# Docker:Staging

**В этом режиме используются секреты для dev-окружения.**

1. Запустить `nginx-proxy`.

2. Создать образы и запустить контейнеры:
```bash
task docker:all
task docker:compose:staging
task docker:compose:staging --mongorestore # запуск с восстановлением БД из последнего дампа с дропбокса

task docker:stop --rm # остановить и удалить все контейнеры приложения
```

3. [Подключить](https://github.com/jwilder/nginx-proxy#multiple-networks) `nginx-proxy` к сети приложения:
```
docker network connect <%= project %>-network nginx-proxy
```

4. Добавить запись для локального домена в `/etc/hosts`:
```
127.0.0.1 <%= project %>.local
```

# Docker:Production

Сборка и публикация образов новой версии: `task docker:push`.

## Запуск в продакшене

- установить NodeJS и NPM, если они ещё не установлены
    ```bash
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.38.0/install.sh | bash
    source ~/.profile
    ```
- зайти в директорию с проектом или склонировать в `~/projects/<%= project %>/`, если её ещё нет
- с локальной машины отправить на сервер файлы prod-секретов `task docker:pushSecrets <ip>`
- установить зависимости для запуска задач `npm i tasksfile chalk moment signale`

- на всякий случай `git pull -r`, чтобы обновить файлы проекта
- скачать последние две версии образов `task docker:pull` (скачать последние 5 версий образов: `task docker:pull --count=5`)
- запустить свежие контейнеры `task docker:compose:production`
  - для перезапуска предварительно остановить контейнеры `task docker:stop`

- удалить выключенные контейнеры и неиспользуемые образы: `task clean --docker`
- удалить устаревшие файлы логов: `task logs:prune`

- запустить контейнеры с восстановлением БД из последнего дампа на сервере: `task docker:compose:production --mongorestore`

## Откатить релиз

Все образы версионируются одинаково, таким образом формируется срез и для переключения всего приложения на заданную версию достаточно переключить все образы на одну и ту же версию.

Вывести список последних версий:
```
task docker:versions # последие 5 версий
task docker:versions --tail=20 # последние 20 версий
```

Переключить приложение на заданную версию:
```
task docker:compose:production --tag=тег_версии_образа
```

## Чтение логов

### Логи на хосте
Логи контейнера `<%= project %>` записываются с помощью драйвера `fluentd` в директорию на хосте.

Вывести список доступных логов: `task logs:list`.
Вывести и отслеживать текущие логи: `task logs`.
Вывести последние 30 строк логов за определённую дату: `task logs --date=2020-07-28 --lines=30`.
Удалить логи, записанные позднее 14 дней: `task logs:prune`.
Удалить логи, записанные позднее 30 дней: `task logs:prune --days=30`.

### Логи в контейнерах
Вывести логи контейнера `<%= project %>` за последние 24 часа: `task docker:logs`.
Вывести логи контейнера `<%= project %>-nginx`: `task docker:logs --container=<%= project %>-nginx`.
Вывести логи контейнера `<%= project %>` за последние 3 часа: `task docker:logs --since=3h`.
Выводить логи контейнера `<%= project %>`: `task docker:logs --follow`.

<% if (mongodb !== 'no') { -%>
## Дампы БД

Дампы снимаются автоматически каждый день с помощью образа `tenorok/mongodumper`.

Команды для работы с последним дампом с сервера:
```
task db:dump:get # скачать дамп в текущую директорию
task db:dump:get --dropbox # скачать дамп в дропбокс
task db:dump:get --restore # восстановить БД из дампа без его сохранения
task db:dump:get --dropbox --restore # скачать дамп в дропбокс и восстановить БД
```

Ручной запуск создания дампа на текущей машине:
```
# Создать дамп с дефолтным именем из контейнера монги в дефолтную директорию.
task db:dump:create

# Создать дамп с именем "custom-file-name" из локальной монги в директорию "/var/tmp".
task db:dump:create --dir=/var/tmp --mongoHost=localhost custom-file-name
```

## Миграции БД

Создание новой миграции:
```
task db:migration:create
```

Локальный запуск сервера миграции:
```
task db:migration:start
```

Миграции хранятся в отдельном контейнере, чтобы иметь возможность переключать их между произвольными версиями приложения.

Процесс мигрирования:
1. При изменении схемы данных и до применения миграции приложение должно уметь работать с обоими вариантами схемы (фолбек), таким образом для применения миграции не будет необходимости останавливать работу приложения.
2. Во время запуска приложение считывает текущую версию схемы БД из `package.json/config/migration` и отправляет запрос для актуализации схемы на полученную версию.
3. В контейнере с миграциями запущен сервер, который по запросу `/migrate/{version}` запускает миграцию схем базы данных в нужном направлении, в зависимости от текущего состояния базы данных, которое хранится в коллекции `migrations`.
4. Приложение работает в штатном режиме, при этом параллельно накладываются миграции и не важно сколько времени займёт этот процесс. После завершения мигрирования в ответ на запрос придёт код `201` и будет сброшен кэш БД.
5. В следующей версии приложения можно удалить лишний код (фолбек), который был необходим для работоспособности приложения с несколькими схемами БД.

Вдохновлено статьей: https://www.brunton-spall.co.uk/post/2014/05/06/database-migrations-done-right/

<% } -%>
## Nginx в продакшене

Достаточно запустить два контейнера на весь виртуальный сервер в следующем порядке:

1. Запустить `nginx-proxy`.
Для проксирования запросов в контейнер с ботом используется этот фронтовой контейнер, прослушивающий 80 и 443 порты.
```
docker task -d -p 80:80 -p 443:443 \
    --name nginx-proxy \
    -v ~/letsencrypt/certs:/etc/nginx/certs:ro \
    -v /etc/nginx/vhost.d \
    -v /usr/share/nginx/html \
    -v /var/run/docker.sock:/tmp/docker.sock:ro \
    --log-opt max-size=20m --log-opt max-file=5 \
    --restart=always \
    jwilder/nginx-proxy
```

2. **[Подключить](https://github.com/jwilder/nginx-proxy#multiple-networks) `nginx-proxy` к сети приложения**:
```
docker network connect mrbuffett-network nginx-proxy
```

3. Только **после подключения `nginx-proxy` к сети приложения** для HTTPS-соединения нужно запустить контейнер с Let's Encrypt:
```
docker task -d \
    --name letsencrypt-nginx-proxy \
    -v ~/letsencrypt/certs:/etc/nginx/certs:rw \
    --volumes-from nginx-proxy \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    --log-opt max-size=20m --log-opt max-file=5 \
    --restart=always \
    jrcs/letsencrypt-nginx-proxy-companion
```

Nodejs-сервер запущен по обычному HTTP, куда проксируются запросы от HTTPS.

Инструкция по просмотру информации о сертификатах и форсированному перевыпуску: https://github.com/nginx-proxy/acme-companion/blob/main/docs/Container-utilities.md

# Очистка

Очистить временные файлы, кроме секретов:
```
task clean # все файлы
task clean --docker # только файлы докера
```
<% if (monitoring) { -%>
# Grafana

Добавить источник в Configuration → Data Sources. Выбрать Prometheus с адресом `mrbuffett-bot-prometheus:9090`.

Импортировать дашборд в Create → Import: https://grafana.com/grafana/dashboards/11159
<% } -%>
