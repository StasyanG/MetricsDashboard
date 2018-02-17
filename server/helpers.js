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
        var diff = date2.diff(date1, 'days');
        for(var i = 0; i <= diff; i++) {
            labels.push(moment(date1).add(i, "days").format("YYYY-MM-DD"));
        }

        // Determine number of samples based on number
        // of labels and granularity (days, weeks, month)
        // of representation
        var numOfSamples = 0;
        switch(granularity) {
            case 'days':
                numOfSamples = labels.length;
                break;
            case 'weeks':
                numOfSamples = labels.length/7;
            default:
                return [];
        }

        // Generate graph data
        var graphData = [];
        data.forEach(function(week, i, weeks) {
            var weekIndex = moment(week.timestamp).diff(date1, 'weeks');

            var label = week['metric']+' - '+week['dimension']
                      +(week['filters'] && week['filters'] != '' ? ' ('+weeks['filters']+')' : '');
            var index = null;
            graphData.forEach(function(graph, k, data) {
                if(graph.label == label) {
                    index = k;
                    return;
                }
            });
            if(index == null) {
                var newGraph = {
                    label: label,
                    data: Array.apply(null, new Array(numOfSamples)).map(Number.prototype.valueOf,0)
                }
                index = graphData.push(newGraph) - 1;
            }
            week['values'].forEach(function(valueObj, j, values) {
                graphData[index]['data'][weekIndex*7 + valueObj.dayOfWeek] = valueObj.value;
            });
        });
        return {
            'labels': labels,
            'data': graphData
        };
    },
    logger: function(context, msg) {
        console.log('[' + moment().format('YYYY-MM-DD hh:mm:ss') + '] ' + context + ' > ' + msg);
    },
    send_request: function(host, path) {
        var thisObj = this;
        return new Promise(function(resolve, reject) {
            // Sends request and returns json response
            https.request(host + path, function(res) {
                thisObj.logger('helpers.send_request', res.statusCode + ' ' + host + path);
                var chunks = [];
                res.on('data', function(d) {
                    thisObj.logger('helpers.send_request', 'Got chunk of data');
                    chunks.push(d);
                }).on('end', function() {
                    var data = Buffer.concat(chunks);
                    var result = JSON.parse(data);
    
                    thisObj.logger('helpers.send_request', 'Got full response');
                    if(res.statusCode != 200) {
                        reject('Status ' + result.code + ' | ' + result.message);
                    }
                    resolve(result);
                }).on('error', function(e) {
                    reject(e);
                });;
            }).on('error', function(e) {
                reject(e);
            }).end();
        });
    },
    splitArrayIntoChunks: function(arr, chunkSize) {
        var chunks = [], i;
        for (i = 0; i < arr.length; i += chunkSize) {
            chunks.push(arr.slice(i, i + chunkSize));
        }
        return chunks;
    }
}