const { sh, shPipe, help } = require('./_utils');

const clean = {
    default(options) {
        const { docker } = options;

        if (!docker) {
            sh('git clean -xdf --exclude="docker/secrets/"');
        }

        const exitedContainers = shPipe(
            'docker ps -qa -f status=exited',
        ).trim().split('\n');
        // Приходится делать ручную проверку, потому что `xargs -r` не работает в MacOS.
        if (exitedContainers.length) {
            // Удалить все выключенные контейнеры.
            exitedContainers.forEach((id) => sh(`docker rm -f ${id}`));
        }
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
