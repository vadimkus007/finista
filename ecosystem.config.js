module.exports = {
  apps : [{
    name: 'finista-dev',
    script: './bin/www',
    watch: true,
    ignore_watch: ['node_modules','views','template','public'],
    watch_options: {
      followSymlinks: false
    }
  }]
};
