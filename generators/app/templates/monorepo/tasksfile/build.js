const { sh, help } = require('./_utils');

/**
 * Замена базового пути до локальных зависимостей, чтобы при
 * установке текущего пакета корректно зарезолвились его
 * зависимости внутри node_modules того пакета, в который он устанавливается.
 */
function relocateLocalDependencies(filePath) {
    const packageJson = require(filePath);
    const deps = packageJson.localDependencies;
    for (let name in deps) {
        deps[name] = deps[name].replace(/app\/dist\/$/, '');
    }
    fs.writeFileSync(path.join(__dirname, filePath), JSON.stringify(packageJson, null, 4));
}

const build = {
    default() {
        sh('rm -rf app/dist');
        sh('tsc -p app/tsconfig.json');
        sh('cp -r config/ app/dist/config/');
        sh('mkdir -p app/dist/docker/secrets/');
        sh('cp -r docker/secrets/stub.js app/dist/docker/secrets/get.js');
        sh('cp package.json app/dist/package.json');
        relocateLocalDependencies('../app/dist/package.json');
    },
};

help(build.default, 'Build app for using by another packages');

module.exports = build;
