import type { Server } from 'http';
import config from 'config';
import express from 'express';
import { createTerminus } from '@godaddy/terminus';

import { createLogger } from '@common/Logger';
const log = createLogger('server');

export function createServer(): void {
    const app = express();

    const port = config.get<number>('<%= project %>.port');
    const httpServer = app.listen(port, () => {
        log.info(`<%= project %> server listening at port ${port}`);
        // Функция отправки сигнала родительскому процессу доступна только под pm2.
        // https://pm2.keymetrics.io/docs/usage/signals-clean-restart/#graceful-start
        if (process.send) {
            process.send('ready');
        }
    });

    createTerminus<Server>(httpServer, {
        timeout: 2000,
        signal: 'SIGINT',
        onSignal() {
            log.warn('Exit signal received');

            // ... Closing DB connection and other actions ...

            // https://pm2.keymetrics.io/docs/usage/signals-clean-restart/#graceful-stop
            process.exit(0);
        },
        onShutdown() {
            log.error('Server forced shutting down');
            return Promise.resolve();
        },
    });
}
