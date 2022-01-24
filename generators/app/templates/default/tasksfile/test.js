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
            'NODE_ENV=testing mocha',
            '--require source-map-support/register', // Обязательно должно идти первым, иначе ломаются карты кода
            '--require ts-node/register',
            '--require tsconfig-paths/register',
            '--recursive',
            `${reporterFlag} ${path}`,
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
