const {
    sh,
    shPipe,
    help,
    Command,
} = require('./_utils');
<% if (mongodb !== 'no') { -%>
const db = require('./db');
<% } -%>
const moment = require('moment');

const IMAGE_APP = 'registry.gitlab.com/tenorok/<%= project %>';
const IMAGES = [
    IMAGE_APP,
];

function prepareSources() {
    sh('rm -rf dist');
    sh('tsc');

    sh('rm -rf node_modules_production');
    sh('mkdir node_modules_production');
    sh('cp package.json node_modules_production/');
    sh('cp package-lock.json node_modules_production/');
    sh(
        'npm ci --production --prefix node_modules_production ./node_modules_production',
    );
}

const docker = {
    build() {
        prepareSources();

        sh(`docker build --squash -t ${IMAGE_APP} .`);
    },
    compose: {
        dev(options) {
            const { build } = options;

            if (build) {
                docker.build();
            }

            sh(
                'TAG=latest docker-compose -f docker/default.yml -f docker/dev.yml up',
            );
        },
        staging(options) {
<% if (mongodb !== 'no') { -%>
            const { mongorestore } = options;
<% } -%>
            const cmd = new Command('docker-compose -f docker/default.yml -f docker/staging.yml up -d');
            cmd.env('TAG', 'latest');

<% if (mongodb !== 'no') { -%>
            if (mongorestore) {
                cmd.env('DUMP_NAME', db.getDropboxLastDumpName());
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
                cmd.env('DUMP_NAME', db.getLastDumpName());
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
        docker.build();

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

help(docker.build, 'Build docker image');
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
    }
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
