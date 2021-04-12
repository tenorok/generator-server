import * as client from 'prom-client';
import * as config from 'config';
import express = require('express');

import { createLogger } from './Logger';
const log = createLogger('Prometheus');

const prom = express();

client.collectDefaultMetrics();

prom.get('/metrics', async (_, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

const port = config.get<number>('prometheus.port');
prom.listen(port, () => {
    log.info(`Process listening at port ${port}`);
});
