const {
    sh,
    help,
    lastFileCommand,
    DROPBOX_DUMP_DIR,
} = require('./_utils');
const migration = require('../migrator/tasksfile/migration');

const db = {
    dump: {
        create(options, backupFileName) {
            const config = require('config');

            const { dumpsdir } = config.get('server');
            const {
                dir = dumpsdir,
                mongoHost = '<%= project %>-mongo',
            } = options;
            const cmd = [`docker run --rm -v ${dir}:/backup --network=<%= project %>-network`];

            cmd.push(`-e 'MONGO_HOST=${mongoHost}'`);
            cmd.push('-e \'MONGO_DB_NAMES=<%= project %>\'');

            if (backupFileName) {
                cmd.push(`-e 'BACKUP_FILE_NAME=${backupFileName}'`);
            }

            cmd.push('tenorok/mongodumper:2.0 no-cron');

            sh(cmd.join(' '));
        },
        get(options) {
            const config = require('config');

            const {
                dropbox,
                restore,
            } = options;

            const { user, ip, dumpsdir } = config.get('server');
            const dump = sh(`ssh ${user}@${ip} ${lastFileCommand(dumpsdir)}`, {
                stdio: 'pipe',
            }).trim();

            const dest = dropbox ? DROPBOX_DUMP_DIR : '.';

            sh(`scp ${user}@${ip}:${dumpsdir}/${dump} ${dest}`);

            if (restore) {
                const dumpPath = dest + '/' + dump;
                db.restore(dumpPath);
                if (!dropbox) {
                    sh(`rm ${dumpPath}`);
                }
            }
        },
    },
    restore(options, dump) {
        sh(`mongorestore --gzip --archive=${dump}`);
    },
    migration,
};

help(db.dump.create, 'Create dump from MongoDB container on the current machine', {
    params: ['backupFileName'],
    options: {
        dir: 'Target directory to save dump file',
        mongoHost: 'Host of MongoDB container (example: localhost)',
    },
});
help(db.dump.get, 'Download dump into current directory', {
    options: {
        dropbox: 'Put dump into Dropbox',
        restore: 'Only restore DB from dump without saving file',
    },
});
help(db.restore, 'Restore local MongoDB from dump', {
    params: ['dumpPath'],
});

module.exports = db;
