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
            '--require error-stack-handler',
            '--recursive',
            '--compilers ts:ts-node/register,tsconfig-paths/register',
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
            'NODE_ENV=testing chokidar',
            `"src/**/*.ts" "${mask}"`,
            `-c "run test --reporter=dot ${path}"`,
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
