const { sh, help } = require('../../tasksfile/_utils');
const fs = require('fs');
const path = require('path');

process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '..', '..', 'config');

const packagejsonPath = path.resolve(__dirname, '..', '..', 'package.json');
const packagejson = require(packagejsonPath);

const migrationsPath = path.resolve(__dirname, '..', 'src', 'migrations');

function incrementPackagejsonMigration() {
    packagejson.config.migration++;
    fs.writeFileSync(
        packagejsonPath,
        JSON.stringify(packagejson, null, 2) + '\n',
        'utf-8',
    );
    return packagejson.config.migration;
}

function runStart(command) {
    sh([
        'DEBUG=*',
        'NODE_ENV=development',
        'NODE_CONFIG_DIR=' + process.env.NODE_CONFIG_DIR,
        'TS_NODE_LOG_ERROR=true',
        command,
        '| npx bunyan --time local',
    ].join(' '));
}

function start() {
    runStart('ts-node -r tsconfig-paths/register migrator/src/index.ts');
}

start.watch = function() {
    runStart('nodemon --exec ./node_modules/.bin/ts-node -- -r tsconfig-paths/register ./migrator/src/index.ts');
};

const migration = {
    create() {
        const config = require('config');
        const signale = require('signale');
        const chalk = require('chalk');
        const MigrateMongoose = require('migrate-mongoose');

        const version = incrementPackagejsonMigration();
        const host = config.get('mongodb.host');
        const port = config.get('mongodb.port');
        const db = config.get('mongodb.db');

        const migrator = new MigrateMongoose({
            migrationsPath,
            templatePath: path.resolve(__dirname, '..', 'template.ts'),
            dbConnectionUri: `mongodb://${host}:${port}/${db}`,
        });
        migrator.create(version).then(({ createdAt, name }) => {
            const timestamp = new Date(createdAt).getTime();
            const pathToMigration = `${migrationsPath}/${timestamp}-${name}.ts`;
            signale.success(`Migration created: ${chalk.yellow.underline(pathToMigration)}`);
            migrator.close();
        });
    },
    start,
};

help(migration.create, 'Create new migration');
help(migration.start, 'Start migration server');
help(migration.start.watch, 'Start migration server and restart on every changing');

module.exports = migration;
