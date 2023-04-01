const { installMonorepoDeps } = require('../../common/tasksfile/_utils');
const base = require('../../common/tasksfile/base/build');

const build = {
    default(options) {
        base.default(options);
    },
    dist() {
        base.dist();

        installMonorepoDeps('../app/dist/package.json', {
            prefixTo: 'app/dist/',
        });
    },
};

base.default.help(build.default);
base.dist.help(build.dist);

module.exports = build;
