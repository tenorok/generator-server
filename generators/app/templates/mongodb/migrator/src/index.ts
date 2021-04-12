import * as path from 'path';
import * as config from 'config';
import express = require('express');
import MigrateMongoose = require('migrate-mongoose');
import findLast = require('lodash/findLast');

import { createLogger } from '@common/Logger';
const log = createLogger('Migrator');

const migrator = express();

const mongoHost = config.get<string>('mongodb.host');
const mongoPort = config.get<string>('mongodb.port');
const mongoDb = config.get<string>('mongodb.db');

const migrateMongoose = new MigrateMongoose({
    migrationsPath: path.resolve(__dirname, 'migrations'),
    dbConnectionUri: `mongodb://${mongoHost}:${mongoPort}/${mongoDb}`,
    autosync: true,
});

migrator.get('/migrate/:version', async (req, res) => {
    // Перед получением списка миграций migrate-mongoose выполняет синхронизацию,
    // поэтому отдельный вызов `sync()` не требуется.
    const migrationsList = await migrateMongoose.list();
    const lastApplied = findLast<MigrateMongoose.MigrationData>(
        migrationsList,
        (migration) => migration.state === 'up',
    );
    const lastAppliedVersion = lastApplied ? parseInt(lastApplied.name, 10) : 0;

    const targetVersion: number = parseInt(req.params.version, 10);
    let direction: MigrateMongoose.Direction;
    /** Имя миграции, которую нужно применить последней в заданном направлении. */
    let migrationName;

    if (targetVersion === lastAppliedVersion) {
        res.sendStatus(200);
        return;
    }

    if (targetVersion > lastAppliedVersion) {
        direction = 'up';
        migrationName = targetVersion;
    } else {
        direction = 'down';
        migrationName = targetVersion + 1;
    }

    migrateMongoose.run(direction, String(migrationName))
        .then(() => res.sendStatus(201))
        .catch((err: Error) => {
            log.error(err);
            res.sendStatus(500);
        });
});

const port = config.get<number>('migrator.port');
migrator.listen(port, () => {
    log.info(`Process listening at port ${port}`);
});
