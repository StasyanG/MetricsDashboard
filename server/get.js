var fs = require('fs');
var https = require('https');
var moment = require('moment');
moment.locale('ru');

var DataWeekModel = require('./models/data_week');
const dbMetrics = require('./db/metrics');
const dbAccounts = require('./db/accounts');

const helpers = require('./helpers');
const YaMetrics = require('./classes/YaMetrics.js');
const LiveInternet = require('./classes/LiveInternet.js');

function get_counter_list() {
    return new Promise(function(resolve, reject) {
        var counters = [];
        fs.readFile('./data/counters.txt', 'utf8', function(err, contents) {
            if(err) {
                reject(err);
            }
            var cnts = contents.split('\r\n');
            cnts.forEach(function(cnt, i, cnts) {
                if(!cnt.length) return;
                var cntdata = cnt.split(' ');
                var name = cntdata[0];
                var type = cntdata[1];
                var id = cntdata.length > 2 ? cntdata[2] : '';
                var token = cntdata.length > 3 ? cntdata[3] : '';
                counters.push({
                    name: name,
                    type: type,
                    id: id,
                    token: token
                });
            });
            resolve(counters);
        });
    });
}

function get_yandex(metricsId, id, api_token, date1, date2, group, dataSets=null) {
    
    return new Promise(function(resolve, reject) {
        var yaMetrics = new YaMetrics(metricsId, id, api_token);
        var dataCounter = 0;

        var toGet = [
            {metrics: ['ym:s:visits'], dimensions: ['ym:s:isNewUser']},
            {metrics: ['ym:s:visits'], dimensions: ['ym:s:firstTrafficSource']},
            {metrics: ['ym:s:pageDepth', 'ym:s:avgVisitDurationSeconds'], dimensions: []}
        ];
        if(dataSets) {
            toGet = dataSets;
        }

        var numOfDatasets = toGet.length;
        var nCount = 0;
        var promises = [];

        toGet.reduce(function(promise, dataset) {
            return promise.then(function() {
                return Promise.all([
                    yaMetrics.get_metrics(date1, date2, group, 
                        dataset.metrics, dataset.dimensions)
                    .then(function(counted) {
                        dataCounter += counted;
                        nCount++;
                        if(nCount == numOfDatasets) {
                            resolve(dataCounter);
                        }
                    })
                    .catch(function(error) {
                        helpers.logger('get.get_yandex', 'ERROR occured!\n' + error);
                        reject(error);
                    }),
                    helpers.delay(1000)
                ]);
            })
        }, Promise.resolve())
    });

}

function get_liveinternet(name) {

    return new Promise(function(resolve, reject) {
        var liveInternet = new LiveInternet(name);

        liveInternet.get_metrics()
        .then(function(counted) {
            resolve(counted);
        })
        .catch(function(error) {
            helpers.logger('get.get_liveinternet', 'ERROR occured!\n' + error);
            reject(error);
        });
    });

}

module.exports = {
    get_counters: function(res) {

        get_counter_list()
        .then(function(counters) {
            counters.forEach(function(cnt, i, counters) {
                delete cnt.token;
            });
            res.send({
                status: 'OK',
                data: counters
            });
        })
        .catch(function(err) {
            console.error(err);
            res.send({
                status: 'ERROR',
                msg: err
            });
        });

    },
    get_data: async function(res, date1, date2, id=null, dataSets=null) {
        date1 = moment(date1).startOf("day");
        var date1Str = date1.format('YYYY-MM-DD');
        date2 = moment(date2).startOf("day");
        var date2Str = date2.format('YYYY-MM-DD');

        helpers.logger('get.get_data', date1Str + ' ' + date2Str);

        try {
            let allMetrics = await dbMetrics.getAllMetrics();
            // @TODO:
            // Need to filter metrics so that the same provider accounts
            // don't get updated multiple times

            if (id != null) {
                allMetrics = allMetrics.filter(metrics => metrics._id == id);
            }

            const nMetrics = allMetrics.length;
            let nCount = 0;
            allMetrics.forEach(async metrics => {
                const account = await dbAccounts.getAccount(metrics.accountId);

                helpers.logger('get.get_data',
                `Owner: ${account.owner}`
                + ` | Account: ${account.username} (${account.provider})`
                + ` | Metrics: ${metrics.name} (${metrics.id})`);
                
                if(account.provider == 'Yandex') {
                    get_yandex(metrics._id.toString(), metrics.id,
                        account.oauthAccessToken, date1Str, date2Str, 'day', dataSets)
                    .then(function() {
                        nCount++;
                        helpers.logger('get.get_data', `${nCount}/${nMetrics}`);
                        if(nCount == nMetrics) {
                            res.send({
                                status: 'OK',
                                data: 'Got Metrics data'
                            });
                        }
                    })
                    .catch(function(err) {
                        res.send({
                        status: 'ERROR',
                        msg: err
                        });
                    });
                } else if (account.provider == 'LiveInternet') {
                    get_liveinternet(metrics.id.toString())
                    .then(function() {
                        nCount++;
                        helpers.logger('get.get_data', `${nCount}/${nMetrics}`);
                        if(nCount == numOfCounters) {
                            res.send({
                                status: 'OK',
                                data: 'Got Metrics data'
                            });
                        }
                    })
                    .catch(function(err) {
                        res.send({
                            status: 'ERROR',
                            msg: err
                        });
                    });
                } else if (account.provider == 'Google') {
                    helpers.logger('get.get_data', 'Skipped');
                    helpers.logger('get.get_data', 'GOOGLE ANALYTICS NOT IMPLEMENTED');
                    nCount++;
                    helpers.logger('get.get_data', `${nCount}/${nMetrics}`);
                    if(nCount == nMetrics) {
                        res.send({
                            status: 'OK',
                            data: 'Got Metrics data'
                        });
                    }
                }
            })
        } catch(e) {
            res.send({
                status: 'ERROR',
                msg: 'Cannot get data (requested metrics not found)'
            });
        }
    }
}