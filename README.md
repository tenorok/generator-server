# Генаратор серверного проекта

Подготовка генератора для локальных запусков:
```
npm link
```

Создание проекта из генератора:
```
mkdir project
cd project
yo server
```

Копипаста команды для проверки перегенерации проекта:
```
test-project › cd .. && rm -rf test-project && mkdir test-project && cd test-project && yo server
```
