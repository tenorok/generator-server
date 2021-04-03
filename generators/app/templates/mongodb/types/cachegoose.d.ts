declare module 'cachegoose' {
    import * as mongoose from 'mongoose';

    namespace Cachegoose {
        export function clearCache(
            customKey?: string | null,
            cb?: (err?: Error) => void,
        ): void;
    }

    function Cachegoose(mongoose: mongoose, cacheOptions = {}): void;
    export = Cachegoose;
}

declare module 'mongoose' {
    interface DocumentQuery {
        cache(ttl?: number | null, customKey?: string): this;
        getCacheKey(): string;
    }
}
