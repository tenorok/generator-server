const { sh, help } = require('./_utils');

const test = {
    default(options, testPath) {
        const { reporter, skipts } = options;
        const reporterFlag = reporter ? `--reporter=${reporter}` : '';
        const path = testPath || 'test/';
        const cmd = [];

        if (skipts) {
            cmd.push('TS_NODE_LOG_ERROR=true');
        }

        cmd.push(
            // Чтобы прокинуть ошибочный exitcode на выход,
            // не смотря на красивый вывод через bunyan.
            'set -o pipefail &&',

            'NODE_ENV=testing mocha',

            // Обязательно должно идти первым, иначе ломаются карты кода
            '--require source-map-support/register',

            '--require ../../node_modules/ts-node/register',
            '--require tsconfig-paths/register',

            // Должно быть в конце, чтобы фильтровался стек ошибок.
            '--require @empire/common/modules/error-stack-cleaner/register',

            '--recursive',
            `${reporterFlag} ${path}`,
            '| ./node_modules/.bin/bunyan --time local',
        );

        sh(cmd.join(' '));
    },

    watch(options, testPath) {
        const { skipts } = options;
        const mask = testPath || 'test/**/*.js';
        const path = testPath || 'test/';
        const cmd = [];

        if (skipts) {
            cmd.push('TS_NODE_LOG_ERROR=true');
        }

        cmd.push(
            'chokidar',
            `"app/src/**/*.ts" "${mask}"`,
            `-c "task test --reporter=dot ${path}"`,
            '--initial',
        );

        sh(cmd.join(' '));
    },
};

help(test.default, 'Run unit tests', {
    params: ['path'],
    options: {
        reporter: 'Mocha reporter (npx mocha --list-reporters)',
        skipts: 'Logs TypeScript errors to stderr instead of throwing exceptions',
    },
});
help(test.watch, 'Run unit tests on every changing', {
    params: ['path'],
    options: {
        skipts: 'Logs TypeScript errors to stderr instead of throwing exceptions',
    },
});

module.exports = test;
