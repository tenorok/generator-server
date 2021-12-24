const { sh: baseSh, help } = require('tasksfile');

function sh(cmd, options = {}) {
    // @see https://github.com/pawelgalazka/tasksfile/issues/103
    baseSh(cmd, Object.assign({ nopipe: true }, options));
}

function shPipe(cmd, options = {}) {
    return baseSh(cmd, Object.assign({ stdio: 'pipe' }, options));
}

const DAY = 60 * 60 * 24 * 1000;

class Command {
    constructor(cmd) {
        this.cmd = cmd;
        this.envMap = new Map();
    }

    env(name, value) {
        this.envMap.set(name, value);
    }

    get() {
        const cmd = [];
        for (const [name, value] of this.envMap) {
            cmd.push(`${name}="${value}"`);
        }

        cmd.push(this.cmd);

        return cmd.join(' ');
    }
}

<% if (mongodb !== 'no') { -%>
const os = require('os');
const DROPBOX_DUMP_DIR = `${os.homedir()}/Dropbox/<%= project %>/app-mongobackup`;

function lastFileCommand(dir) {
    return `ls -lat ${dir} | grep ".gz$" | head -1 | awk '{print $9}'`;
}

/** Получить путь до последнего дампа БД из дропбокса. */
function getDropboxLastDumpName() {
    return sh(lastFileCommand(DROPBOX_DUMP_DIR), {
        stdio: 'pipe',
    }).trim();
};

/** Получить имя последнего дампа БД на сервере. */
function getLastDumpName() {
    const config = require('config');

    const { dumpsdir } = config.get('server');

    return sh(lastFileCommand(dumpsdir), {
        stdio: 'pipe',
    }).trim();
};

<% } -%>
module.exports = {
    sh,
    shPipe,
    help,
    DAY,
    Command,
<% if (mongodb !== 'no') { -%>
    DROPBOX_DUMP_DIR,
    lastFileCommand,
    getDropboxLastDumpName,
    getLastDumpName,
<% } -%>
};
