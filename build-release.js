var NwBuilder = require('nw-builder');
// var manifest = require('./src/package.json');

var nw = new NwBuilder({
    files: './src/**/**',
    buildDir: './build/release',
    winIco: './src/magneto.ico',
    platforms: ['linux', 'osx64', 'win'],
    flavor: 'normal',
    version: 'latest'
});

nw.on('log', console.log);

nw.build().then(function () {
    console.log('Build done!');
}).catch(function (error) {
    console.error(error);
});
