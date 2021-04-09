declare module 'migrate-mongoose' {
    namespace MigrateMongoose {
        type Direction = 'up' | 'down';

        interface Options {
            dbConnectionUri: string;
            migrationsPath?: string;
            autosync?: boolean;
        }

        interface MigrationData {
            state: Direction;
            name: string;
            createdAt: Date;
            filename: string;
        }
    }

    class MigrateMongoose {
        constructor(options: Options);

        public sync(): Promise;
        public list(): Promise<MigrationData[]>;
        public run(direction: Direction, migrationName: string): Promise;
    }

    export = MigrateMongoose;
}
