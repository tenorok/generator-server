const chai = require('chai');
chai.use(require('chai-shallow-deep-equal'));
const assert = chai.assert;
const sinon = require('sinon');
const mongoose = require('mongoose');
const cachegoose = require('cachegoose');
const _ = require('lodash');
require('deepdash')(_);
const db = require('../common/src/DB/instance').default;
db.cacheTTL = 0;

describe('DB', () => {
    let models;

    before(() => {
        if (!db.connection.db) {
            // Дожидаемся появления db.connection.db
            return new Promise((resolve) => {
                db.connection.on('open', async () => {
                    // Дожидаемся создания моделей.
                    models = await Promise.all(
                        _.mapDeep(db.models, (model) => model, {
                            leavesOnly: true,
                        }),
                    );
                    resolve();
                });
            });
        }
    });

    beforeEach(async () => {
        // Вызов model.syncIndexes() в BaseModel.prototype.create() создаёт коллекцию
        // поэтому в первом beforeEach() коллекции повторно создавать нельзя.
        const dbCollections = await db.connection.db.listCollections().toArray();
        for (const model of models) {
            const collectionName = model.collection.collectionName;
            if (
                !dbCollections.find(
                    (collection) => collection.name === collectionName,
                )
            ) {
                await db.connection.createCollection(collectionName);
            }

            // Нужно пересчитать индексы для сброса предыдущего состояния.
            await model.syncIndexes();
        }
    });

    afterEach(async () => {
        for (const model of models) {
            await db.connection.dropCollection(model.collection.collectionName);
        }
        await new Promise((resolve) => {
            cachegoose.clearCache(null, resolve);
        });
    });

    after(async () => {
        await db.destructor();
    });

    describe('createUser()', () => {
        it('Должен создавать пользователя с предзаданными значениями', async () => {
            const user = await db.createUser({
                name: 'John',
            });

            assert.isObject(user);
            assert.instanceOf(user, await db.models.user);
            assert.propertyVal(user, 'name', 'John');
            assert.property(user, 'clientId');
            assert.property(user, 'updatedAt');
            assert.property(user, 'updatedAt');
        });
    });

    describe('findUserById()', () => {
        it('Должен возвращать нулевой результат при отсутствии пользователя', async () => {
            const user = await db.findUserById('5c60488d0bdc947f06965d12');
            assert.isNull(user);
        });

        it('Должен возвращать простой объект пользователя', async () => {
            const userId = (await db.createUser({
                name: 'John',
            }))._id;
            const user = await db.findUserById(userId);

            assert.isObject(user);
            assert.notInstanceOf(user, await db.models.user);
        });
    });

    describe('cachegoose', () => {
        const sandbox = sinon.sandbox.create();
        let cacheSpy;

        beforeEach(() => {
            cacheSpy = sandbox.spy(mongoose.Query.prototype, 'cache');
        });

        afterEach(() => {
            cachegoose._cache.clear();
            sandbox.restore();
        });

        describe('findUserById()', () => {
            it('Должен использовать кэш', async () => {
                await db.findUserById('5c60488d0bdc947f06965d12');
                sinon.assert.calledOnce(cacheSpy);
                sinon.assert.calledWithExactly(cacheSpy, 0, '5c60488d0bdc947f06965d12-userid');
            });

            it('Кэш должен очищаться после создания нового пользователя', async () => {
                await db.findUserById('5c60488d0bdc947f06965d12'); // В действительности cachegoose даже не кэширует результат null.
                const userId = (await db.createUser({
                    name: 'John',
                }))._id;
                const user = await db.findUserById(userId);
                assert.isNotNull(user);
                assert.isAbove(Object.keys(user).length, 0);
            });
        });
    });
});
