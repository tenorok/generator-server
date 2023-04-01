declare module 'mongoose-beautiful-unique-validation' {
    import type { Schema, Document, Model } from 'mongoose';

    const Plugin: <D extends Document>(schema: Schema<D, Model<D>>) => void;
    export = Plugin;
}
