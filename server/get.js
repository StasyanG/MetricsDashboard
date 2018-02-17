var fs = require('fs');
var https = require('https');
var moment = require('moment');
moment.locale('ru');

var MetricsWeekModel = require('./models/metric_week').MetricsWeekModel;

var helpers = require('./helpers');
const YaMetrics = require('./classes/YaMetrics.js');

function get_counter_list() {
    return new Promise(function(resolve, reject) {
        var counters = [];
        fs.readFile('./data/counters.txt', 'utf8', function(err, contents) {
            if(err) {
                reject(err);
            }
            var cnts = contents.split('\n');
            cnts.forEach(function(cnt, i, cnts) {
                if(!cnt.length) return;
                var cntdata = cnt.split(' ');
                var name = cntdata[0];
                var type = cntdata[1];
                var id = cntdata[2];
                var token = cntdata[3];
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

function get_yandex(name, id, api_token, date1, date2, group) {
    
    return new Promise(function(resolve, reject) {
        var yaMetrics = new YaMetrics(id, name, api_token);
        var count = 0;

        yaMetrics.get_metrics(date1, date2, group,
            ['ym:s:visits'], ['ym:s:isNewUser'])
        .then(function(counted) {
            count += counted;
            return yaMetrics.get_metrics(date1, date2, group,
                ['ym:s:visits'], ['ym:s:firstTrafficSource']);
        })
        .then(function(counted) {
            count += counted;
            return yaMetrics.get_metrics(date1, date2, group,
                ['ym:s:pageDepth', 'ym:s:avgVisitDurationSeconds'], [])
        })
        .then(function(counted) {
            count += counted;
            resolve(count);
        })
        .catch(function(error) {
            helpers.logger('get.get_yandex', 'ERROR occured!\n' + error);
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
    get_all_interval: function(res, date1, date2) {

        date1 = moment(date1).startOf("day");
        var date1Str = date1.format('YYYY-MM-DD');
        date2 = moment(date2).startOf("day");
        var date2Str = date2.format('YYYY-MM-DD');

        get_counter_list()
        .then(function(counters) {
            counters.forEach(function(cnt, i, counters) {
                if(cnt.type == 'Yandex') {
                    get_yandex(cnt.name, cnt.id, cnt.token, date1Str, date2Str, 'day');
                }
            });
            res.send({
                status: 'OK',
                data: 'Getting Metrics Data...'
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
    get_one: function(res, name, type, date1, date2) {

        date1 = moment(date1).startOf("day");
        var date1Str = date1.format('YYYY-MM-DD');
        date2 = moment(date2).startOf("day");
        var date2Str = date2.format('YYYY-MM-DD');

        helpers.logger('get.get_one', date1Str + ' ' + date2Str);

        get_counter_list()
        .then(function(counters) {
            var found = counters.filter(function(item) {
                return item.name == name && item.type == type;
            });
            if(!found.length) {
                res.send({
                    status: 'ERROR',
                    msg: 'Counter not found'
                });
            } else {
                var cnt = found[0];
                helpers.logger('get.get_one', cnt.name + ' ' + cnt.type + ' ' + cnt.id);
                if(cnt.type == 'Yandex') {
                    get_yandex(cnt.name, cnt.id, cnt.token, date1Str, date2Str, 'day')
                    .then(function(counted) {
                        res.send({
                            status: 'OK',
                            data: 'Got Metrics data for Yandex#' + cnt.id + ' (' + counted + ')'
                        });
                    })
                    .catch(function(err) {
                        res.send({
                            status: 'ERROR',
                            msg: err
                        });
                    });
                }
            }
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