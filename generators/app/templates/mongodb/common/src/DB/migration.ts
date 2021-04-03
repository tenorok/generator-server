import axios, { AxiosError } from 'axios';
import 'axios-debug-log';
import * as config from 'config';
import db from './instance';

import { createLogger } from '@common/Logger';
const log = createLogger('DB');

import * as packagejson from '../../../package.json';
const migrationVersion = packagejson.config.migration;
log.info(`Starting migration to version ${migrationVersion}.`);

axios
    .create({
        baseURL: config.get<string>('migrator.host') + ':' + config.get<number>('migrator.port'),
    })
    .get('/migrate/' + migrationVersion)
    .then((response) => {
        if (response.status === 200) {
            log.info('Migration not required.');
        } else if (response.status === 201) {
            db.clearAllCache();
            log.info(`Migration to version ${migrationVersion} successfully completed.`);
        }
    })
    .catch((error: AxiosError<void>) => {
        if (error.response && error.response.status === 500) {
            log.warn(`Migration to version ${migrationVersion} failed.`);
        }
    });
