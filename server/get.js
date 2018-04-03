var fs = require('fs');
var https = require('https');
var moment = require('moment');
moment.locale('ru');

var MetricsWeekModel = require('./models/metric_week').MetricsWeekModel;

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

function get_yandex(name, id, api_token, date1, date2, group, dataSets=null) {
    
    return new Promise(function(resolve, reject) {
        var yaMetrics = new YaMetrics(id, name, api_token);
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
            return promise.then(function(result) {
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
    get_data: function(res, date1, date2, name=null, type=null, dataSets=null) {

        date1 = moment(date1).startOf("day");
        var date1Str = date1.format('YYYY-MM-DD');
        date2 = moment(date2).startOf("day");
        var date2Str = date2.format('YYYY-MM-DD');

        helpers.logger('get.get_data', date1Str + ' ' + date2Str);

        get_counter_list()
        .then(function(counters) {
            var found = counters;
            if(name && type) {
                found = counters.filter(function(item) {
                    return item.name == name && item.type == type;
                });
            }
            if(found.length == 0) {
                res.send({
                    status: 'ERROR',
                    msg: 'Requested counter NOT FOUND'
                });
                return;
            }

            var numOfCounters = found.length;
            var nCount = 0;
            found.forEach(function(cnt, i, counters) {
                helpers.logger('get.get_data', 'Start processing of '
                    + cnt.name + ' ' + cnt.type + ' ' + cnt.id);
                
                if(cnt.type == 'Yandex') {
                    get_yandex(cnt.name, cnt.id, cnt.token, date1Str, date2Str, 'day', dataSets)
                    .then(function(counted) {
                        nCount++;
                        helpers.logger('get.get_data', 'End processing of '
                            + cnt.name + ' ' + cnt.type + ' ' + cnt.id
                            + ' (' + nCount + '/' + numOfCounters + ')');
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
                } else if (cnt.type == 'LiveInternet') {
                    console.log('asd');
                    get_liveinternet(cnt.name)
                    .then(function(counted) {
                        nCount++;
                        helpers.logger('get.get_data', 'End processing of '
                            + cnt.name + ' ' + cnt.type
                            + ' (' + nCount + '/' + numOfCounters + ')');
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
                }
            });
        })
        .catch(function(err) {
            console.error(err);
            res.send({
                status: 'ERROR',
                msg: err
            });
        });

    }
}