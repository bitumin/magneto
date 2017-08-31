var request = require('request');
var _ = require('underscore');
var magnetUri = require('magnet-uri');
var cheerio = require('cheerio');
var clipboard = nw.Clipboard.get();
var validUrl = require('valid-url');

// Initialize Framework7 UI
var myApp = new Framework7();
var $$ = Dom7;

// Load main view
var mainView = myApp.addView('.view-main', {
    dynamicNavbar: true
});

// Search click handler
var doSearch = function (e) {
    if (e.type === 'keyup' && e.keyCode !== 13) {
        return;
    }

    // Fetch user search query
    var formData = myApp.formToData('#my-form');
    var searchQuery = formData.search;

    // Go to results page
    mainView.router.loadContent($$('#results').html());

    // check if we already have fetched a list of tpb proxies
    Mgt.search(searchQuery);
};
$$('.form-to-data').on('click', doSearch);
$$("input[name=search]").on('keyup', doSearch);

// App namespace
var Mgt = {};

// Load local cache of sources
Mgt.sources = require('./sources.json');
console.info('Loaded local list of sources', Mgt.sources);

// Dynamic source aggregation methods
Mgt.sourceAggregator = {};
Mgt.sourceAggregator.tpb = function () {
    var tpbProxiesUrl = 'https://proxybay.github.io/';

    console.info('Retrieving fresh TPB sources...');
    request(tpbProxiesUrl, function (error, response, body) {
        if (error) {
            console.error(tpbProxiesUrl + ' seems to be down.');
            return;
        }

        var freshTpbProxies = [];
        var $ = cheerio.load(body);
        $('table[id="searchResult"]').find('tr').each(function (i, el) {
            var tr = $(el);
            if (tr.find('td.status > img').attr('alt') === 'up') {
                var freshProxyUrl = tr.find('td.site > a[href^="http"]').attr('href');
                if (
                    typeof freshProxyUrl === 'string'
                    && freshProxyUrl.length
                    && validUrl.isWebUri(freshProxyUrl)
                ) {
                    freshTpbProxies.push({
                        "url": freshProxyUrl,
                        "type": "tpb"
                    });
                }
            }
        });

        console.info('List of fresh TPB proxies: ', freshTpbProxies);

        // Merge fresh proxies with already loaded ones (remove duplicated proxies by url property)
        if (freshTpbProxies.length > 0) {
            console.info('Adding ' + freshTpbProxies.length + ' fresh TPB proxies to sources list');
            Mgt.sources = _.uniq(_.union(Mgt.sources, freshTpbProxies), false, function (proxy) {
                return proxy.url;
            });
        }
    });
};
Mgt.sourceAggregator.init = function () {
    console.info('Initializing dynamic sources aggregators');
    Mgt.sourceAggregator.tpb();
    // todo: add more dynamic aggregators
};
Mgt.sourceAggregator.init();

// Loading utils
Mgt.preloader = {};
Mgt.preloader.log = function (txt) {
    var logTarget = $$('.preloading-log');
    logTarget.children().each(function (i, el) {
        var logEl = $$(el);
        if (!logEl.hasClass('fadeOut')) {
            logEl.addClass('animated fadeOut');
        }
    });
    logTarget.prepend('<div>' + txt + '</div>');
};
Mgt.preloader.fatal = function (txt) {
    $$('.preloading-block').hide();
    $$('.content-block.results').append($$(
        '<p>Magnets not found: ' + txt + '</p>' +
        '<p><a href="#" class="back">Back to Search</a></p>'
    ));
};
Mgt.preloader.isDone = false;
Mgt.preloader.done = function () {
    Mgt.preloader.isDone = true;
    $$('.preloading-block').hide();
    $$('.content-block.results')
        .append($$('#results-table-template').html())
        .on('click', 'a.magnet-link', function () {
            clipboard.set($$(this).data('magnet'), 'text');
            myApp.alert('Magnet link for "' + $$(this).data('name') + '" copied to your system clipboard', 'Great success!');
        });
    console.log($$('#results-table'));
    Mgt.results.table = new Tablesort($$('#results-table')[0], {descending: true});
};

// Results handlers
Mgt.results = {};
Mgt.results.added = [];
Mgt.results.add = function (magnet, name, uploaded, size, uploadedBy, seeders, leechers) {
    // Validate magnet before adding
    if (typeof magnet !== 'string' || !magnet.length) {
        return;
    }

    try {
        var parsedMagnet = magnetUri.decode(magnet);
    } catch (err) {
        console.warn('Unable to decode magnet link:' + magnet);
        return;
    }

    if (typeof parsedMagnet === 'undefined' || typeof parsedMagnet.xt !== 'string' || !parsedMagnet.xt.length) {
        return;
    }

    // Ensure this magnet has not been already added to the results list
    if (_.contains(Mgt.results.added, parsedMagnet.xt)) {
        return;
    }
    Mgt.results.added.push(parsedMagnet.xt);

    // Finish preloading process
    if (!Mgt.preloader.isDone) {
        Mgt.preloader.done();
    }

    $$('#results-table')
        .find('tbody')
        .append($$(
            '<tr>' +
            '    <td>' +
            '        <a class="magnet-link" href="#" data-magnet="' + magnet + '" data-name="' + name + '">' +
            '            <i class="fa fa-magnet"></i>' +
            '        </a>' +
            '    </td>' +
            '    <td class="label-cell">' + name + '</td>' +
            '    <td>' + uploaded + '</td>' +
            '    <td>' + size + '</td>' +
            '    <td>' + uploadedBy + '</td>' +
            '    <td class="numeric-cell">' + seeders + '</td>' +
            '    <td class="numeric-cell">' + leechers + '</td>' +
            '</tr>'
        ));

    Mgt.results.table.refresh();
};

// Scraper
Mgt.Scraper = function (type) {
    this.scrape = function () {
        switch (type) {
            case 'tpb':
                return Mgt.scrapeStrategies.tpb;
        }
    }();
};
Mgt.Scraper.prototype.scrapeMagnets = function (url, searchQuery) {
    this.scrape(url, searchQuery);
};

// Scraping strategies
Mgt.scrapeStrategies = {};
Mgt.scrapeStrategies.tpb = function (url, searchQuery) {
    return request(url + '/search/' + encodeURI(searchQuery) + '/0/99/0', function (error, response, body) {
        if (error) {
            console.warn('Source ' + url + 'returned an error response (' + error + ')');
            return;
        }

        console.info('Source ' + url + ' responded. Validating response...');
        var $ = cheerio.load(body);
        var resultsTrList = $('#searchResult').find('tbody > tr');
        if (!resultsTrList.length) {
            console.warn('Response from ' + url + ' seems to not be valid. Ignoring response.');
            return;
        }

        console.info('Response from ' + url + ' validated. Loading results...');

        resultsTrList.each(function (i, el) {
            var tr = $(el);
            var magnet = tr.find('a[href^="magnet"]').attr('href');
            var name = tr.find('.detName > a').text();
            var uploadedBy = tr.find('a.detDesc').text();
            var description = tr.find('font.detDesc').clone().children().remove().end().text().split(',');
            var uploaded = typeof description[0] !== 'undefined' ? description[0].replace('Uploaded ', '') : '';
            var size = typeof description[1] !== 'undefined' ? description[1].replace('Size ', '') : '';
            var seeders = tr.find('td:nth-last-child(2)').text();
            var leechers = tr.find('td:last-child').text();

            Mgt.results.add(magnet, name, uploaded, size, uploadedBy, seeders, leechers);
        });
    });
};

// Search
Mgt.search = function (searchQuery) {
    // Reset preloading
    Mgt.preloader.isDone = false;
    Mgt.results.added = [];

    Mgt.preloader.log('Searching magnets...');
    for (var i = 0; i < Mgt.sources.length; i++) {
        new Mgt.Scraper(Mgt.sources[i].type).scrapeMagnets(Mgt.sources[i].url, searchQuery);
    }
};
