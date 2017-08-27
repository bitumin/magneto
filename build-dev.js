var NwBuilder = require('nw-builder');

var nw = new NwBuilder({
    files: './src/**/**',
    buildDir: './build/dev',
    platforms: ['linux64'],
    flavor: 'sdk',
    version: 'latest'
});

nw.on('log',  console.log);

nw.build().then(function () {
    console.log('all done!');
}).catch(function (error) {
    console.error(error);
});
