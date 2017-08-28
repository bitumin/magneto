// var express = require('express');
// var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var clipboard = nw.Clipboard.get();

// App utilities
var magneto = {};
magneto.preloading = {};
magneto.preloading.log = function (txt) {
    var logTarget = $$('.preloading-log');
    logTarget.children().each(function (i, el) {
        var logEl = $$(el);
        if (!logEl.hasClass('fadeOut')) {
            logEl.addClass('animated fadeOut');
        }
    });
    logTarget.prepend('<div>' + txt + '</div>');
};
magneto.preloading.fatal = function (txt) {
    $$('.preloading-block').hide();
    $$('.content-block').append($$(
        '<p>Magnets not found: ' + txt + '</p>' +
        '<p><a href="#" class="back">Back to Search</a></p>'
    ));
};
magneto.preloading.done = function () {
    $$('.preloading-block').hide();
    $$('.content-block').append($$(
        '<div class="content-block-inner results">' +
        '  <div class="data-table card">' +
        '    <table>' +
        '      <thead>' +
        '        <tr>' +
        '          <th>Magnet</th>' +
        '          <th class="label-cell">Name</th>' +
        '          <th>Uploaded</th>' +
        '          <th>Size</th>' +
        '          <th>Uploaded by</th>' +
        '          <th class="numeric-cell">Seeders</th>' +
        '          <th class="numeric-cell">Leechers</th>' +
        '        </tr>' +
        '      </thead>' +
        '      <tbody>' +
        '      </tbody>' +
        '    </table>' +
        '  </div>' +
        '</div>'
    ));
};
magneto.preloading.loadResult = function (magnet, name, uploaded, size, uploadedBy, seeders, leechers) {
    $$('.content-block-inner.results').find('tbody').append($$(
        '<tr>' +
        '  <td><a href="#" onclick="copyToClipboard(\'' + magnet + '\', \'' + name + '\');"><i class="fa fa-magnet"></i></a></td>' +
        '  <td class="label-cell">' + name + '</td>' +
        '  <td>' + uploaded + '</td>' +
        '  <td>' + size + '</td>' +
        '  <td>' + uploadedBy + '</td>' +
        '  <td class="numeric-cell">' + seeders + '</td>' +
        '  <td class="numeric-cell">' + leechers + '</td>' +
        '</tr>'
    ));
};

// Initialize Framework7 UI
var myApp = new Framework7();
var $$ = Dom7;
var mainView = myApp.addView('.view-main', {
    dynamicNavbar: true
});

var tpbProxies = [];
var openConnections = [];
var errorResponses = 0;
var validatedResponses = 0;

function startQueryingForMagnets(searchQuery) {
    magneto.preloading.log('Querying for magnets...');

    validatedResponses = 0;
    for (var i = 0; i < tpbProxies.length; i++) {
        openConnections[i] = requestListOfMagnets(tpbProxies[i], i, searchQuery);
    }
}

$$('.form-to-data').on('click', function () {

    // Fetch user search query
    var formData = myApp.formToData('#my-form');
    var searchQuery = formData.search;

    // Preload results page
    createResultsPage();

    // check if we already have fetched a list of tpb proxies
    magneto.preloading.log('Retrieving proxies list...');
    if (tpbProxies.length) {
        startQueryingForMagnets(searchQuery);
    } else {
        magneto.preloading.log('Requesting new proxies list...');
        request('https://proxybay.github.io/', function (error, response, body) {
            if (error) {
                magneto.preloading.fatal('Proxy index seems to be down. Try again later.');
                return;
            }
            magneto.preloading.log('Saving proxies list...');
            var $ = cheerio.load(body);
            $('table[id="searchResult"]').find('tr').each(function (i, el) {
                var tr = $(el);
                if (tr.find('td.status > img').attr('alt') === 'up') {
                    tpbProxies.push(tr.find('td.site > a[href^="http"]').attr('href'));
                }
            });
            console.log('List of fetched proxies: ', tpbProxies);
            if (!tpbProxies.length) {
                magneto.preloading.fatal('No proxies seems to be up and running. Try again later.');
                return;
            }

            startQueryingForMagnets(searchQuery);
        });
    }
});

function createResultsPage() {
    mainView.router.loadContent(
        '<div class="navbar">' +
        '  <div class="navbar-inner">' +
        '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back to Search</span></a></div>' +
        '    <div class="center sliding">Magnets</div>' +
        '  </div>' +
        '</div>' +
        '<div class="pages">' +
        '  <div data-page="dynamic-pages" class="page">' +
        '    <div class="page-content">' +
        '      <div class="content-block">' +
        '        <div class="preloading-block">' +
        '          <div class="col-100"><span class="preloader"></span></div>' +
        '          <br>' +
        '          <div class="col-100 preloading-log"></div>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>'
    );
}

function resetAllConnections() {
    openConnections = [];
    errorResponses = 0;
}

function closeAllConnections() {
    for (var i = 0; i < openConnections.length; i++) {
        openConnections[i].abort();
    }
    resetAllConnections();
}

function invalidResponse(searchQuery) {
    if (++errorResponses >= tpbProxies.length) {
        magneto.preloading.fatal('None of the proxies returned a valid list of magnets with the keywords "' + searchQuery + '". Try again later or try another search.');
        resetAllConnections();
    }
}

function requestListOfMagnets(proxy, connectionNumber, searchQuery) {
    var requestOptions = {
        method: 'GET',
        url: proxy + '/search/' + encodeURI(searchQuery) + '/0/99/0',
        timeout: 30000
    };
    return request(requestOptions, function (error, response, body) {
        openConnections.splice(connectionNumber, 1);
        if (error) {
            console.log('Proxy ' + proxy + 'returned an error response (' + error + ')');
            invalidResponse(searchQuery);
            return;
        }

        console.log('Proxy ' + proxy + ' responded. Validating response...');

        var $ = cheerio.load(body);
        var resultsTrList = $('#searchResult').find('tbody > tr');
        if (!resultsTrList.length) {
            console.log('Response from ' + proxy + ' seems to not be valid. Ignoring response.');
            invalidResponse(searchQuery);
            return;
        }

        // Prevent requests race condition
        if (++validatedResponses > 1) {
            return;
        }

        console.log('Response from ' + proxy + ' validated. Loading results...');

        closeAllConnections();
        magneto.preloading.done();
        resultsTrList.each(function (i, el) {
            var tr = $(el);

            var magnet = tr.find('a[href^="magnet"]').attr('href');
            var name = tr.find('.detName > a').text();
            var uploadedBy = tr.find('a.detDesc').text();
            var description = tr.find('font.detDesc').clone().children().remove().end().text().split(',');
            var uploaded = description[0].replace('Uploaded ', '');
            var size = description[1].replace('Size ', '');
            var seeders = tr.find('td:nth-last-child(2)').text();
            var leechers = tr.find('td:last-child').text();

            magneto.preloading.loadResult(magnet, name, uploaded, size, uploadedBy, seeders, leechers);
        });
    });
}

function copyToClipboard(magnet, name) {
    clipboard.set(magnet, 'text');
    myApp.alert('Magnet link for "' + name + '" copied to your system clipboard', 'Great success!');
}
