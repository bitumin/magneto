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

// Initialize Framework7
var myApp = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

// Callbacks to run specific code for specific pages, for example for About page:
myApp.onPageInit('about', function (page) {
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
});

// Generate dynamic page
var dynamicPageIndex = 0;

function createContentPage() {
    mainView.router.loadContent(
        '<!-- Top Navbar-->' +
        '<div class="navbar">' +
        '  <div class="navbar-inner">' +
        '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
        '    <div class="center sliding">Dynamic Page ' + (++dynamicPageIndex) + '</div>' +
        '  </div>' +
        '</div>' +
        '<div class="pages">' +
        '  <!-- Page, data-page contains page name-->' +
        '  <div data-page="dynamic-pages" class="page">' +
        '    <!-- Scrollable page content-->' +
        '    <div class="page-content">' +
        '      <div class="content-block">' +
        '        <div class="content-block-inner">' +
        '          <p>Here is a dynamic page created on ' + new Date() + ' !</p>' +
        '          <p>Go <a href="#" class="back">back</a> or go to <a href="services.html">Services</a>.</p>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>'
    );
}
