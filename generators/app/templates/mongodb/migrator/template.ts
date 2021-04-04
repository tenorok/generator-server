import db from '@common/DB/instance';

import { createLogger } from '@common/Logger';
const log = createLogger('Migrator:${FILE}');

/**
 * Задача: ...
 * Фолбек: Не требуется | <commit>
 */

export async function up(): Promise<void> {
    // ...

    log.info('Up was completed.');
}

export async function down(): Promise<void> {
    // ...

    log.info('Down was completed.');
}
