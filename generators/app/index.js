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
                name: 'mongodb',
                message: 'MongoDB version or «no»:',
                default: '4.0.2',
            },
            {
                type: 'confirm',
                name: 'monitoring',
                message: 'Prometheus + Grafana?',
                default: true
            }
        ];

        this.answers = await this.prompt(prompts);
    }

    writing() {
        this._copyTpl('default');

        if (this.answers.mongodb) {
            this._copyTpl('mongodb');
        }

        if (this.answers.monitoring) {
            this._copyTpl('monitoring');
        }
    }

    _copyTpl(from) {
        this.fs.copyTpl(
            this.templatePath(from),
            this.destinationPath(),
            {
                project: this.answers.project,
                nodejs: this.answers.nodejs,
                mongodb: this.answers.mongodb,
                monitoring: this.answers.monitoring,
            },
            {},
            { globOptions: { dot: true } }
        );
    }
};
