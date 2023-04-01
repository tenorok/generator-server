import type { SetOptional } from 'type-fest';
import type { Document, Query, NativeError } from 'mongoose';
import { Schema } from 'mongoose';
import cachegoose = require('cachegoose');
import mongooseLeanDefaults = require('mongoose-lean-defaults');
import { v4 as uuidv4 } from 'uuid';

import BaseModel from './BaseModel';

import { createLogger } from '@common/Logger';
const log = createLogger('DB:User');

type ObjectId = Schema.Types.ObjectId;
type Next = (err?: NativeError) => void;

/** Поля, которые нужно передать для создания пользователя. */
export interface IUser {
    name: string;
}

/** Поля, добавляемые автоматически. */
export interface IUserModel extends Document {
    clientId: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema: Schema<IUserModel> = new Schema({
    clientId: {
        type: String,
    },
    name: {
        type: String,
    },
}, {
    timestamps: true,
});

userSchema.plugin(mongooseLeanDefaults);

userSchema.pre<SetOptional<IUserModel, 'clientId'>>(
    'save',
    { document: true },
    function (next: Next): void {
        if (this.isNew) {
            this.clientId = uuidv4();
        }
        next();
    },
);

userSchema.post<IUserModel>('save', (user: IUserModel, next: Next) => {
    cachegoose.clearCache(getByIdCacheKey(user.id as ObjectId));
    next();
});
userSchema.post<IUserModel>('save', (err: NativeError, _: IUserModel, next: Next) => {
    log.error(err);
    next(err);
});

userSchema.post<Query<IUserModel, IUserModel>>('findOneAndUpdate', (user: IUserModel | null, next: Next) => {
    if (user) {
        cachegoose.clearCache(getByIdCacheKey(user.id as ObjectId));
    }
    next();
});
userSchema.post<Query<IUserModel, IUserModel>>('findOneAndUpdate', (err: NativeError, _: IUserModel, next: Next) => {
    log.error(err);
    next(err);
});

export class UserModel extends BaseModel<IUserModel> {
    protected name = 'User';
    protected schema = userSchema;
    protected collection = 'users';
}

export function getByIdCacheKey(userId: ObjectId): string {
    return String(userId) + '-userid';
}
