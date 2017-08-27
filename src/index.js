// var express = require('express');
// var fs = require('fs');
var request = require('request');
// var cheerio = require('cheerio');
// var app = express();
// var http = require('http');

// Node API example
// var os = require('os');
// document.write('You are running on ', os.platform());

// NWjs API example
// // Create an empty context menu
// var menu = new nw.Menu();
//
// // Add some items with label
// menu.append(new nw.MenuItem({
//     label: 'Item A',
//     click: function(){
//         alert('You have clicked at "Item A"');
//     }
// }));
// menu.append(new nw.MenuItem({ label: 'Item B' }));
// menu.append(new nw.MenuItem({ type: 'separator' }));
// menu.append(new nw.MenuItem({ label: 'Item C' }));
//
// // Hooks the "contextmenu" event
// document.body.addEventListener('contextmenu', function(ev) {
//     // Prevent showing default context menu
//     ev.preventDefault();
//     // Popup the native context menu at place you click
//     menu.popup(ev.x, ev.y);
//
//     return false;
// }, false);

document.querySelector('#req').addEventListener('click', function () {
    request('http://www.google.com', function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
    });

    return false;
});
