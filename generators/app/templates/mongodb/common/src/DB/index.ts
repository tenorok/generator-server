import config from 'config';
import mongoose from 'mongoose';
import beautifyUnique = require('mongoose-beautiful-unique-validation');
import cachegoose = require('cachegoose');
import type { IUser, IUserModel } from './models/User';
import {
    UserModel,
    getByIdCacheKey as getUserByIdCacheKey,
} from './models/User';

import { createLogger } from '@common/Logger';
const log = createLogger('DB');

const isDevelopment = config.util.getEnv('NODE_ENV') === 'development';
mongoose.set('debug', isDevelopment);
mongoose.plugin(beautifyUnique);

cachegoose(mongoose);

type ObjectId = mongoose.Schema.Types.ObjectId;

export default class DB {
    private connection: mongoose.Connection;
    private models: {
        user: Promise<mongoose.Model<IUserModel>>;
    };

    /**
     * Время кэширования результатов запросов.
     * - null - не кэшировать
     * - 60 - кэшировать на 60 секунд
     * - 0 - кэшировать навсегда
     */
    private _cacheTTL: number | null = null;

    constructor(host: string, port: string, db: string) {
        this.connection = this.connect(host, port, db);
        this.models = {
            user: new UserModel(this.connection).create(),
        };
    }

    public set cacheTTL(value: number | null) {
        this._cacheTTL = value;
    }

    public async destructor(): Promise<[void, void | Error]> {
        return Promise.all([
            this.connection.close(),
            new Promise<void | Error>((resolve) => {
                cachegoose.clearCache(null, resolve);
            }),
        ]);
    }

    public async createUser(user: IUser): Promise<IUserModel | null> {
        return (await this.models.user)
            .create(user)
            .catch((err) => {
                log.error(err);
                return null;
            });
    }

    public async findUserById(userId: ObjectId): Promise<IUserModel | null> {
        return (await this.models.user)
            .findById(userId)
            .lean<IUserModel>({ defaults: true })
            .cache(this._cacheTTL, getUserByIdCacheKey(userId))
            .exec()
            .catch((err) => {
                log.error(err);
                return null;
            });
    }

    public clearAllCache(): void {
        cachegoose.clearCache(null);
    }

    private connect(host: string, port: string, db: string): mongoose.Connection {
        const connection = mongoose.createConnection(`mongodb://${host}:${port}/${db}`, {

            // @ts-ignore
            loggerLevel: isDevelopment ? 'info' : 'error',

            // Отключение автоматического создания индексов.
            autoIndex: false,

            // Опции для перехода с устаревших методов.
            useNewUrlParser: true,
            useFindAndModify: false,

            // Переход на вечно подключенное состояние.
            // http://mongodb.github.io/node-mongodb-native/3.3/reference/unified-topology/
            useUnifiedTopology: true,
        });

        connection
            .on('connected', () => {
                log.info('Connected to MongoDB');
            })
            .on('disconnected', () => {
                log.info('Disconnected from MongoDB');
            })
            .on('reconnect', () => {
                log.info('Reconnected to MongoDB');
            })
            .on('reconnectFailed', () => {
                log.info('Reconnect to MongoDB failed');
            });

        connection.catch((err: Error) => {
            log.error(err);
            connection.close();

            // Если подключение не было установлено с первой попытки,
            // лучше полностью завершить процесс, чтобы попробовать запустить его заново.
            process.exit();
        });

        return connection;
    }
}
