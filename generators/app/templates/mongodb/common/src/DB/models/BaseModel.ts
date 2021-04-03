import { Connection, Document, Schema, Model } from 'mongoose';

import { createLogger } from '@common/Logger';
const log = createLogger('DB:BaseModel');

export default abstract class BaseModel<Doc extends Document> {
    /** Имя модели. */
    protected abstract name: string;
    /** Схема модели. */
    protected abstract schema: Schema;
    /** Имя коллекции. */
    protected abstract collection: string;

    constructor(private connection: Connection) {}

    public async create(): Promise<Model<Doc>> {
        const model = this.connection.model<Doc>(this.name, this.schema, this.collection);

        model.on('index', (err) => {
            if (err) {
                log.error('Index error: %s', err);
            } else {
                log.info('Indexing complete');
            }
        });

        try {
            // Запуск индексации модели для работы `unique: true`.
            await model.syncIndexes();
        } catch (err) {
            if (err) {
                log.error(err);
            }
        }

        return model;
    }
}
