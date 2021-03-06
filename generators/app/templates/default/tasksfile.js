const { cli } = require('tasksfile');
const start = require('./tasksfile/start');
<% if (monorepo) { -%>
const build = require('./tasksfile/build');
<% } -%>
const test = require('./tasksfile/test');
const docker = require('./tasksfile/docker');
const clean = require('./tasksfile/clean');
const logs = require('./tasksfile/logs');
<% if (mongodb !== 'no') { -%>
const db = require('./tasksfile/db');
<% } -%>

cli({
    start,
<% if (monorepo) { -%>
    build,
<% } -%>
    test,
    docker,
    clean,
    logs,
<% if (mongodb !== 'no') { -%>
    db,
<% } -%>
});
