const {
    sh,
    shPipe,
    help,
    Command,
<% if (mongodb !== 'no') { -%>
    getDropboxLastDumpName,
    getLastDumpName,
<% } -%>
} = require('./_utils');
const moment = require('moment');

const IMAGE_APP = 'registry.gitlab.com/tenorok/test-project';
const IMAGE_MIGRATOR = 'registry.gitlab.com/tenorok/test-project/migrator';
const IMAGE_NGINX = 'registry.gitlab.com/tenorok/test-project/nginx';
const IMAGE_MONGO = 'registry.gitlab.com/tenorok/test-project/mongo';
const IMAGE_FLUENTD = 'registry.gitlab.com/tenorok/test-project/fluentd';
const IMAGE_PROMETHEUS = 'registry.gitlab.com/tenorok/test-project/prometheus';
const IMAGES = [
    IMAGE_APP,
    IMAGE_MIGRATOR,
    IMAGE_NGINX,
    IMAGE_MONGO,
    IMAGE_FLUENTD,
    IMAGE_PROMETHEUS,
];

function prepareNodeModules() {
    sh('rm -rf node_modules_production');
    sh('mkdir node_modules_production');
    sh('cp package.json node_modules_production/');
    sh('cp package-lock.json node_modules_production/');
    sh('npm ci --production --prefix node_modules_production ./node_modules_production');

    // TypeScript не резолвит пути из compilerOptions.paths в скомпилированном коде.
    sh('ln -s ../dist/common/src node_modules_production/node_modules/@common');
}

const docker = {
    app() {
        prepareNodeModules();

        sh('rm -rf app/dist');
        sh('tsc -p app/tsconfig.json');
        sh(`docker build --squash -t ${IMAGE_APP} -f app/Dockerfile .`);
    },
    migrator() {
        prepareNodeModules();

        sh('rm -rf migrator/dist');
        sh('tsc -p migrator/tsconfig.json');
        sh(`docker build --squash -t ${IMAGE_MIGRATOR} -f migrator/Dockerfile .`);
    },
    nginx() {
        sh(`docker build --squash -t ${IMAGE_NGINX} ./nginx`);
    },
    mongo() {
        sh(`docker build --squash -t ${IMAGE_MONGO} ./mongo`);
    },
    fluentd() {
        sh(`docker build --squash -t ${IMAGE_FLUENTD} ./fluentd`);
    },
    prometheus() {
        sh(`docker build --squash -t ${IMAGE_PROMETHEUS} ./prometheus`);
    },
    all() {
        prepareNodeModules();

        docker.image.app();
        docker.image.migrator();
        docker.image.nginx();
        docker.image.mongo();
        docker.image.fluentd();
        docker.image.prometheus();
    },
    compose: {
        dev(options) {
            const { build } = options;

            if (build) {
                docker.app();
            }

            sh(
                'TAG=latest docker-compose -f docker/default.yml -f docker/dev.yml up',
            );
        },
        staging(<%= mongodb !== 'no' ? 'options' : '' %>) {
<% if (mongodb !== 'no') { -%>
            const { mongorestore } = options;
<% } -%>
            const cmd = new Command('docker-compose -f docker/default.yml -f docker/staging.yml up -d');
            cmd.env('TAG', 'latest');

<% if (mongodb !== 'no') { -%>
            if (mongorestore) {
                cmd.env('DUMP_NAME', getDropboxLastDumpName());
            }

<% } -%>
            sh(cmd.get());
        },
        production(options) {
            const {
                tag = 'latest',
<% if (mongodb !== 'no') { -%>
                mongorestore,
<% } -%>
            } = options;
            const cmd = new Command('docker-compose -f docker/default.yml -f docker/production.yml up -d');
            cmd.env('TAG', tag);

<% if (mongodb !== 'no') { -%>
            if (mongorestore) {
                cmd.env('DUMP_NAME', getLastDumpName());
            }

<% } -%>
            sh(cmd.get());
        },
    },
    pull(options) {
        const { count = 2 } = options;

        sh('git fetch --all --tags');
        const tagsList = shPipe(
            `git tag -l --sort=committerdate | tail -n ${count}`,
        )
            .trim()
            .split('\n')
            .concat('latest');

        tagsList.forEach((tag) => {
            IMAGES.forEach((image) => {
                sh(`docker pull ${image}:${tag}`);
            });
        });
    },
    push() {
        docker.app();

        const tag = moment().format('DD.MM.YYYY-HH.mm');
        IMAGES.forEach((image) => {
            sh(`docker tag ${image} ${image}:${tag}`);
        });
        sh(`git tag ${tag}`);

        IMAGES.forEach((image) => {
            sh(`docker push ${image}`);
        });
        sh(`git push origin ${tag}`);
    },
    pushSecrets(options, ip) {
        sh(
            `scp -r ./docker/secrets/prod root@${ip}:~/projects/<%= project %>/docker/secrets/`,
        );
    },
    logs(options) {
        const {
            container = '<%= project %>',
            since = '24h',
            follow,
        } = options;

        const containerId = shPipe(
            `docker ps --filter "name=${container}_" --format "{{.ID}}"`,
        ).trim();
        const commandOptions = [];

        if (follow) {
            commandOptions.push('--tail=10 --follow');
        }

        sh(
            `docker logs --since ${since} ${commandOptions.join()} ${containerId} | ./node_modules/.bin/bunyan --time local`,
        );
    },
    versions(options) {
        const { tail = '5' } = options;

        sh(
            `docker image ls ${IMAGE_APP} --format "{{.Tag}}" | grep -v -E latest | head -n ${tail}`,
        );
    },
    stop(options) {
        const { rm } = options;
        const containerIds = shPipe(
            'docker ps --filter "name=<%= project %>" --format "{{.ID}}" --all',
        ).replace(/\n/g, ' ');

        sh(`docker stop ${containerIds}`);

        if (rm) {
            sh(`docker rm ${containerIds}`);
        }
    },
};

help(docker.app, 'Build main app docker image');
help(docker.migrator, 'Build migrator docker image');
help(docker.nginx, 'Build nginx docker image');
help(docker.mongo, 'Build mongo docker image');
help(docker.fluentd, 'Build fluentd docker image');
help(docker.prometheus, 'Build prometheus docker image');
help(docker.all, 'Build all docker images');
help(docker.compose.dev, 'Run docker-compose with development config', {
    options: {
        build: 'Build images before run compose',
    },
});
help(
    docker.compose.staging,
    'Run docker-compose with production config but with development secrets',
<% if (mongodb !== 'no') { -%>
    {
        options: {
            mongorestore: 'Restore MongoDB from last dropbox dump',
        },
    },
<% } -%>
);
help(docker.compose.production, 'Run docker-compose with production config', {
    options: {
        tag: 'Tag with version of images (default: latest)',
<% if (mongodb !== 'no') { -%>
        mongorestore: 'Restore MongoDB from last dump on the server',
<% } -%>
    },
});
help(docker.pull, 'Pull images from registry', {
    options: {
        count: 'Count of the latest images to pull',
    },
});
help(docker.push, 'Build images, mark by a tag and push to the registry');
help(docker.pushSecrets, 'Push production docker secrets to the server', {
    params: ['ip'],
});
help(docker.logs, 'Print container logs', {
    options: {
        container: 'Name of container with logs (default: <%= project %>)',
        since: 'Show logs within time limit (default: 24h)',
        follow: 'Continue printing logs',
    },
});
help(docker.versions, 'Print image versions', {
    options: {
        tail: 'Number of latest version to show (default: 5)',
    },
});
help(docker.stop, 'Stop running containers', {
    options: {
        rm: 'Remove stopped containers',
    },
});

module.exports = docker;
