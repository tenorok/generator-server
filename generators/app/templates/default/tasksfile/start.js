const { sh, help, Command } = require('./_utils');

function runStart(command, options) {
    const { nodebug } = options;
    const debug = ['-follow-redirects'];

    const cmd = new Command(command + ' | npx bunyan --time local');

    if (!nodebug) {
        cmd.env('DEBUG', '*,' + debug.join(','));
    }

    cmd.env('NODE_ENV', 'development');
    cmd.env('TS_NODE_LOG_ERROR', 'true');

    sh(cmd.get());
}

const start = {
    default(options) {
        runStart(
            'ts-node --require tsconfig-paths/register ./app/src/index.ts',
            options,
        );
    },

    watch(options) {
        runStart(
            'nodemon --exec ./node_modules/.bin/ts-node -- --require tsconfig-paths/register ./app/src/index.ts',
            options,
        );
    },
};

help(start.default, 'Start application', {
    options: {
        nodebug: 'Disable DEBUG logs',
    },
});
help(start.watch, 'Start application and restart on every changing', {
    options: {
        nodebug: 'Disable DEBUG logs',
    },
});

module.exports = start;
