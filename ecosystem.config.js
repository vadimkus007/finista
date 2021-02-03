module.exports = {
    apps : [
        {
            name: 'server-dev',
            script: './bin/www',
            watch: true,
            ignore_watch: ['node_modules','views','template','public','tmp','uploads', 'client'],
            watch_options: {
              followSymlinks: false
            }
        },
        {
            name: 'client-dev',
            script: 'cd ./client && pm2 start --name client-dev npm -- start',
            watch: false,
            ignore_watch: ['client/node_modules', 'client/public'],
            watch_options: {
              followSymlinks: false
            }
        }
    ]
};
