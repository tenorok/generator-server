module.exports = {
    apps: [{
        name: '<%= project %>',
        script: 'dist/src/index.js',
        max_memory_restart: '256M',
        env_development: {
            watch: ['dist'],
            watch_options: {
                usePolling: true, // Для работы в докер-контейнере.
            },
        },
    }],
};
