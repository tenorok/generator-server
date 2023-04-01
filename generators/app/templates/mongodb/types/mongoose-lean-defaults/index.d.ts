/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'mongoose-lean-defaults' {
    import type { Schema, Document, Model } from 'mongoose';

    const Plugin: <D extends Document>(schema: Schema<D, Model<D>>) => void;
    export = Plugin;
}

declare module 'mongoose' {
    interface DocumentQuery<
        T,
        DocType extends Document,
        QueryHelpers = Record<string, any>
    > {
        lean<P = DocumentDefinition<DocType>>(options: {
            defaults: boolean;
        }): Query<T extends Array<any> ? P[] : P | null> & QueryHelpers;
    }
}
