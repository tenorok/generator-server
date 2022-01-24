const path = require('path');
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
    async prompting() {
        const prompts = [
            {
                name: 'project',
                message: 'Project name:',
                default: path.basename(this.contextRoot),
            },
            {
                name: 'nodejs',
                message: 'NodeJS version:',
                default: '12.18.3',
            },
            {
                name: 'npm',
                message: 'NPM version:',
                default: '6.14.6',
            },
            {
                name: 'mongodb',
                message: 'MongoDB version or «no»:',
                default: '4.0.2',
            },
            {
                type: 'confirm',
                name: 'server',
                message: 'Express server?',
                default: true
            },
            {
                type: 'confirm',
                name: 'monitoring',
                message: 'Prometheus + Grafana?',
                default: true
            },
            {
                type: 'confirm',
                name: 'monorepo',
                message: 'Monorepo package?',
                default: false
            }
        ];

        this.answers = await this.prompt(prompts);
    }

    configuring() {
        if (!this.answers.monorepo) {
            this.spawnCommandSync('git', ['init', '--quiet']);
        }
    }

    writing() {
        this._copyTpl('default');

        if (this.answers.mongodb !== 'no') {
            this._copyTpl('mongodb');
        }

        if (this.answers.monitoring) {
            this._copyTpl('monitoring');
        }

        if (this.answers.server) {
            this._copyTpl('server');
        }

        if (this.answers.monorepo) {
            this._copyTpl('monorepo');
        } else {
            this._copyTpl('singlerepo');
        }

        this.fs.extendJSON(
            this.destinationPath('package.json'),
            this._getPackages(),
        );
    }

    install() {
        this.npmInstall();
    }

    end() {
        this.spawnCommandSync('git', ['add', '.']);

        const message = this.answers.monorepo ? `Добавлен пакет ${this.answers.project}.` : 'Поехали!';
        this.spawnCommandSync('git', ['commit', '-m', message, '--quiet']);
    }

    _copyTpl(from) {
        this.fs.copyTpl(
            this.templatePath(from),
            this.destinationPath(),
            this.answers,
            {},
            { globOptions: { dot: true } }
        );
    }

    _getPackages() {
        const packages = {
            dependencies: {
                "bunyan": "1.8.12",
                "config": "1.26.1",
                "got": "10.6.0",
                "lodash": "4.17.11",
                "pm2": "4.2.3",
            },
            devDependencies: {
                "@types/bunyan": "1.8.0",
                "@types/config": "0.0.32",
                "@types/lodash": "4.14.123",
                "@types/node": "12.20.3",
                "chai": "4.1.2",
                "chai-shallow-deep-equal": "1.4.6",
                "chalk": "2.4.1",
                "chokidar-cli": "2.1.0",
                "mocha": "3.4.2",
                "moment": "2.29.1",
                "nock": "12.0.2",
                "nodemon": "2.0.3",
                "proxyquire": "1.8.0",
                "signale": "1.2.1",
                "sinon": "3.0.0",
                "source-map-support": "0.5.21",
                "tasksfile": "5.1.1",
                "ts-node": "9.1.1",
                "tsconfig-paths": "3.9.0",
                "type-fest": "0.13.0",
                "typescript": "4.1.2"
            },
        };

        if (this.answers.mongodb !== 'no' || this.answers.monitoring || this.answers.server) {
            packages.dependencies = {
                ...packages.dependencies,
                "express": "4.16.4",
            };

            packages.devDependencies = {
                ...packages.devDependencies,
                "@types/express": "4.16.1",
            };
        }

        if (this.answers.mongodb !== 'no') {
            packages.dependencies = {
                ...packages.dependencies,
                "axios": "0.19.2",
                "axios-debug-log": "0.6.2",
                "mongoose": "5.7.13",
                "mongoose-beautiful-unique-validation": "7.1.1",
                "mongoose-lean-defaults": "0.3.2",
                "migrate-mongoose": "git+https://github.com/tenorok/migrate-mongoose.git#template-file-var",
                "cachegoose": "github:tenorok/cachegoose#8.0.0",
                "uuid": "8.0.0",
            };

            packages.devDependencies = {
                ...packages.devDependencies,
                "@types/axios": "0.14.0",
                "@types/mongoose": "5.7.13",
                "@types/uuid": "7.0.3",
            };

        }

        if (this.answers.monitoring) {
            packages.dependencies = {
                ...packages.dependencies,
                "prom-client": "13.1.0",
            };
        }

        if (this.answers.server) {
            packages.dependencies = {
                ...packages.dependencies,
                "@godaddy/terminus": "4.7.2",
            };
        }

        if (!this.answers.monorepo) {
            packages.devDependencies = {
                ...packages.devDependencies,
                "@typescript-eslint/eslint-plugin": "4.21.0",
                "@typescript-eslint/parser": "4.21.0",
                "eslint": "7.23.0",
                "eslint-plugin-ascii": "1.0.0",
                "eslint-plugin-mocha": "5.0.0",
                "husky": "4.3.6",
                "lint-staged": "10.5.3",
                "madge": "4.0.2",
                "prettier": "2.2.1",
            };
        }

        return packages;
    }
};
