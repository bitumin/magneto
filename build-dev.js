var NwBuilder = require('nw-builder');
// var manifest = require('./src/package.json');

var nw = new NwBuilder({
    files: './src/**/**',
    buildDir: './build/dev',
    platforms: ['linux64'],
    flavor: 'sdk',
    version: 'latest'
});

nw.on('log',  console.log);

nw.build().then(function () {
    console.log('Dev build done!');
}).catch(function (error) {
    console.error(error);
});
