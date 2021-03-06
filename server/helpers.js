var http = require('http');
var https = require('https');
var moment = require('moment');

module.exports = {
    dateFormat: function(date) {
        var mm = date.getMonth() + 1;
        var dd = date.getDate();

        return [date.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
        ].join('-');
    },
    generateGraphData: function(data, granularity) {
        if(!data.length) {
            return [];
        }

        // Generate labels based on first and last date in data
        var labels = [];
        var date1 = data.reduce(function(saved, item) {
            return item.timestamp < saved.timestamp ? item : saved;
        }, data[0]).timestamp;
        date1 = moment(date1);
        var date2 = data.reduce(function(saved, item) {
            return item.timestamp > saved.timestamp ? item : saved;
        }, data[0]).timestamp;
        date2 = moment(date2).endOf("week");
        var diff = date2.diff(date1, granularity);
        for(var i = 0; i <= diff; i++) {
            labels.push(moment(date1).add(i, granularity).format("YYYY-MM-DD"));
        }

        // Determine number of samples based on number
        // of labels and granularity (days, weeks, month)
        // of representation
        var numOfSamples = labels.length;

        // Generate graph data
        var graphData = [];
        data.forEach(function(week, i, weeks) {
            var weekIndex = moment(week.timestamp).diff(date1, 'weeks');

            var graphLabel = week['metric']
                + (week['dimension'] && week['dimension'] != '' ? ' - ' + week['dimension'] : '')
                + (week['filters'] && week['filters'] != '' ? ' ('+weeks['filters']+')' : '');
            var index = null;
            graphData.forEach(function(graph, k, data) {
                if(graph.label == graphLabel) {
                    index = k;
                    return;
                }
            });
            if(index == null) {
                var newGraph = {
                    label: graphLabel,
                    data: Array.apply(null, new Array(numOfSamples)).map(Number.prototype.valueOf,0)
                }
                index = graphData.push(newGraph) - 1;
            }
            switch(granularity) {
                case 'days':
                    week['values'].forEach(function(valueObj, j, values) {
                        graphData[index]['data'][weekIndex*7 + valueObj.dayOfWeek] = valueObj.value;
                    });
                    break;
                case 'weeks':
                    var weekSum = 0.0;
                    week['values'].forEach(function(valueObj, j, values) {
                        weekSum += valueObj.value;
                    });
                    graphData[index]['data'][weekIndex] = weekSum;
                default:
                    week['values'].forEach(function(valueObj, j, values) {
                        graphData[index]['data'][weekIndex*7 + valueObj.dayOfWeek] = valueObj.value;
                    });
            }
        });
        return {
            'labels': labels,
            'data': graphData
        };
    },
    logger: function(context, msg) {
        console.log('[' + moment().format('YYYY-MM-DD hh:mm:ss') + '] ' + context + ' > ' + msg);
    },
    send_request: function(host, path, protocol='https') {
        var thisObj = this;
        return new Promise(function(resolve, reject) {
            // Sends request and returns json response
            if(protocol == 'https') {
                https.request(host + path, function(res) {
                    thisObj._procResponse(thisObj, res, host, path, resolve, reject);
                })
                .on('error', function(e) {
                    reject(e);
                }).end();
            } else {
                http.request(host + path, function(res) {
                    thisObj._procResponse(thisObj, res, host, path, resolve, reject);
                })
                .on('error', function(e) {
                    reject(e);
                }).end();
            }
        });
    },
    _procResponse: function(thisObj, res, host, path, resolve, reject) {
        thisObj.logger('helpers.send_request', res.statusCode + ' ' + host + path);
        var chunks = [];
        res.on('data', function(d) {
            thisObj.logger('helpers.send_request', 'Got chunk of data');
            chunks.push(d);
        }).on('end', function() {
            var data = Buffer.concat(chunks);

            thisObj.logger('helpers.send_request', 'Got full response');
            if(res.statusCode != 200) {
                reject('Status ' + res.statusCode);
            }
            resolve(data);
        }).on('error', function(e) {
            reject(e);
        });
    },
    splitArrayIntoChunks: function(arr, chunkSize) {
        var chunks = [], i;
        for (i = 0; i < arr.length; i += chunkSize) {
            chunks.push(arr.slice(i, i + chunkSize));
        }
        return chunks;
    },
    delay: function(ms) {
        var thisHelpers = this;
        return new Promise(function(resolve, reject) {
            thisHelpers.logger('helpers.delay', (ms/1000));
            setTimeout(resolve, ms);
        });
    }
}