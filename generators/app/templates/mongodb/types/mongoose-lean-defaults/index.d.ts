declare module 'mongoose-lean-defaults' {
    import { Schema } from 'mongoose';

    const Plugin: (schema: Schema) => void;
    export = Plugin;
}

declare module 'mongoose' {
    interface DocumentQuery<T, DocType extends Document, QueryHelpers = {}> {
        lean(options: { defaults: boolean }): Query<any> & QueryHelpers;
    }
}
