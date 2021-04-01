const path = require('path');
const fs = require('fs');

let secrets;

module.exports = function get() {
    if (secrets) {
        return secrets;
    }

    secrets = {};

    let secretsPath;
    // Определение запуска в контейнере,
    if (fs.existsSync('/.dockerenv')) {
        secretsPath = '/run/secrets';
    } else { // иначе локальный запуск в режиме разработки.
        secretsPath = path.resolve(__dirname, 'dev');
    }

    // Секреты используются не во всех образах, но
    // конфиг, подключающий данный модуль при этом общий.
    if (!fs.existsSync(secretsPath)) {
        return secrets;
    }

    const fileList = fs.readdirSync(secretsPath);
    for (const fileName of fileList) {
        const ext = path.extname(fileName);
        if (ext !== '') {
            continue;
        }

        secrets[path.basename(fileName, ext)] = fs.readFileSync(path.join(secretsPath, fileName), 'utf-8').trim();
    }

    return secrets;
};
