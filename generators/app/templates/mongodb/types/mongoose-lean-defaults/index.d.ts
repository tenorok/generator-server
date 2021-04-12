/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'mongoose-lean-defaults' {
    import type { Schema } from 'mongoose';

    const Plugin: (schema: Schema) => void;
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
