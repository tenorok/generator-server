const os = require('os');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { sh, help, DAY } = require('./_utils');

const LOGS_DIR = `${os.homedir()}/<%= project %>/logs/`;

const logs = {
    default(options) {
        const {
            date,
            lines,
        } = options;

        if (date) {
            const logsListInfo = logsList();
            const requestedDate = new Date(date).getTime();
            const fileList = logsListInfo
                .filter((fileInfo) => fileInfo.date === requestedDate)
                .map((fileInfo) => {
                    return path.join(LOGS_DIR, fileInfo.fileName);
                });
            let command = `cat ${fileList.join(' ')}`;

            if (lines) {
                command += ` | tail -n ${lines}`;
            }

            sh(command += ' | ./node_modules/.bin/bunyan --time local');
            return;
        }

        const bufferFile = getBuffer();
        if (!bufferFile) {
            // eslint-disable-next-line no-console
            console.log('Buffer does\'t exists');
            return;
        }
        let command = 'tail';

        if (lines) {
            command += ` -n ${lines}`;
        }

        sh(command + ` -f ${path.join(LOGS_DIR, bufferFile)} | ./node_modules/.bin/bunyan --time local`);
    },

    list() {
        const logsListInfo = logsList();

        if (!logsListInfo.length) {
            // eslint-disable-next-line no-console
            console.log('Logs does\'t exists');
            return;
        }

        const list = [];
        let currentDate = logsListInfo[0];
        let currentIndexes = [];
        for (let i = 0; i <= logsListInfo.length; i++) {
            const fileInfo = logsListInfo[i];

            if (i === logsListInfo.length || fileInfo.date !== currentDate.date) {
                const date = new Date(currentDate.date).toISOString().substr(0, 10);
                list.push(`- ${date} ${collapse(currentIndexes)}`);
                currentDate = fileInfo;
                currentIndexes = [];
            }

            if (fileInfo) {
                currentIndexes.push(fileInfo.index);
            }
        }

        // eslint-disable-next-line no-console
        console.log(list.join('\n'));
    },

    prune(options) {
        const { days = 14 } = options;
        const list = [];
        const filesList = fs.readdirSync(LOGS_DIR);
        const pruneTime = Date.now() - days * DAY;

        for (const fileName of filesList) {
            const fileInfo = fileName.match(logRegexp);
            if (!fileInfo) {
                continue;
            }

            const fileTime = new Date(fileInfo[1]).getTime();

            if (fileTime < pruneTime) {
                list.push(path.join(LOGS_DIR, fileName));
            }
        }

        if (!list.length) {
            // eslint-disable-next-line no-console
            console.log('Nothing to prune');
            return;
        }

        sh(`rm ${list.join(' ')}`);
    },
};

const logRegexp = /^app\.(\d{4}-\d{2}-\d{2})_(\d+)\.log$/;
const bufferRegexp = /^app\.[a-z0-9]+\.log$/;

function logsList() {
    const list = [];
    const filesList = fs.readdirSync(LOGS_DIR);

    for (const fileName of filesList) {
        const fileInfo = fileName.match(logRegexp);
        if (!fileInfo) {
            continue;
        }

        list.push({
            fileName,
            date: new Date(fileInfo[1]).getTime(),
            index: parseInt(fileInfo[2], 10),
        });
    }

    return _.sortBy(list, ['date', 'index']);
}

function getBuffer() {
    const filesList = fs.readdirSync(LOGS_DIR);
    for (const fileName of filesList) {
        if (bufferRegexp.test(fileName)) {
            return fileName;
        }
    }

    return '';
}

function collapse(indexes) {
    if (indexes.length === 1) {
        return '';
    }

    const sortedList = indexes.sort((a, b) => a - b);
    const intervals = [String(sortedList[0])];
    let isInInterval = false;

    for (let i = 1; i <= sortedList.length; i++) {
      const prevItem = sortedList[i - 1];
      const item = sortedList[i];

      if (item && item - prevItem === 1) {
        isInInterval = true;
        continue;
      }

      if (isInInterval) {
        intervals[intervals.length - 1] += '-' + prevItem;
        isInInterval = false;
      }

      if (item) {
        intervals.push(String(item));
      }
    }

    return `(${intervals.join(',')})`;
}

help(logs.default, 'Print and follow current logs', {
    options: {
        date: 'Print logs for a certain date (example: 2020-07-28)',
        lines: 'Number of lines to output',
    },
});
help(logs.list, 'Show list of available logs files');
help(logs.prune, 'Delete logs older than 14 days', {
    options: {
        days: 'Number of days for logs age to delete',
    },
});

module.exports = logs;
