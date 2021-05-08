import config from 'config';
import DB from './index';

const db = new DB(
    config.get<string>('mongodb.host'),
    config.get<string>('mongodb.port'),
    config.get<string>('mongodb.db'),
);

export default db;
