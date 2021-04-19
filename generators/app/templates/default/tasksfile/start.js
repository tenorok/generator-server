const { sh, help } = require('./_utils');

function runStart(command) {
    const debug = [
        '-follow-redirects',
    ];

    sh([
        'DEBUG=*,' + debug.join(','),
        'NODE_ENV=development',
        'TS_NODE_LOG_ERROR=true',
        command,
        '| npx bunyan --time local',
    ].join(' '));
}

const start = {
    default() {
        runStart('ts-node --require tsconfig-paths/register ./app/src/index.ts');
    },

    watch() {
        runStart('nodemon --exec ./node_modules/.bin/ts-node -- --require tsconfig-paths/register ./app/src/index.ts');
    },
};

help(start.default, 'Start application');
help(start.watch, 'Start application and restart on every changing');

module.exports = start;
