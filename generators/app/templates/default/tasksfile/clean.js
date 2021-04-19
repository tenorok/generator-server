const { sh, help } = require('./_utils');

const clean = {
    default(options) {
        const { docker } = options;

        if (!docker) {
            sh('git clean -xdf --exclude="docker/secrets/"');
        }

        sh('docker ps -qa -f status=exited | xargs -r docker rm -f'); // Удалить все выключенные контейнеры.
        sh('docker system prune --all --force');
        sh(
            'docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.RunningFor}}\t{{.Status}}\t{{.Size}}"',
        );
    },
};

help(
    clean.default,
    'Cleanup working directory, remove stopped containers and unused images',
    {
        options: {
            docker: 'Clean only docker containers and images',
        },
    },
);

module.exports = clean;
