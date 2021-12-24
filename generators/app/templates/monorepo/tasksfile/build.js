const { sh, help } = require('./_utils');

function installMonorepoDeps(packageJSONPath, options = {}) {
    const {
        prefixTo = './',
    } = options;
    const packageJson = require(packageJSONPath);
    const { monorepo: { name, dependencies }} = packageJson;
    const dirTo = `${prefixTo}node_modules/${name}`;

    sh(`rm -rf ${dirTo}`);
    sh(`mkdir -p ${dirTo}`);

    for (let to in dependencies) {
        const from = dependencies[to];
        sh(`cp -r ${from} ${dirTo}/${to}`);
    }
}

const build = {
    default(options) {
        const { deps } = options;

        if (deps) {
            sh('rm -rf node_modules');
            sh('npm ci');
            installMonorepoDeps('../package.json');
        }
    },
    dist() {
        build.default({});
        sh('rm -rf app/dist');
        sh('tsc -p app/tsconfig.json');
        sh('cp -r config/ app/dist/config/');
        sh('cp -r docker/ app/dist/docker/');
        sh('cp package.json app/dist/');
        sh('cp package-lock.json app/dist/');
        sh('npm ci --production --prefix app/dist/ ./app/dist/');
        installMonorepoDeps('../app/dist/package.json', {
            prefixTo: 'app/dist/',
        });
    },
};

help(build.default, 'Build app', {
    options: {
        deps: 'Reinstall node modules',
    },
});
help(build.dist, 'Build app for using by another packages');

module.exports = build;
