module.exports = {
    apps: [{
        name: '<%= project %>-migrator',
        script: 'dist/migrator/src/index.js',
        max_memory_restart: '256M',
    }],
};
