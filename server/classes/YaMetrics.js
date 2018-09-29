var moment = require('moment');
moment.locale('ru');

const helpers = require('../helpers');
const DataWeekModel = require('../models/data_week');

class YaMetrics {
  constructor(metricsId, cid, api_token) {
    this.metricsId = metricsId;
    this.id = cid;
    this.api_token = api_token;

    this._data_raw = null;
    this._data_to_store = null;

    this._api_host = 'https://api-metrika.yandex.ru';
    this._api_url_base = '/stat/v1/';

    this._metrics_dict = {};
    this._metrics_dict["ym:s:visits"] = "Визиты";
    this._metrics_dict["ym:s:users"] = "Уники";
    this._metrics_dict["ym:s:avgVisitDurationSeconds"] = "Ср. время (сек)";
    this._metrics_dict["ym:s:pageDepth"] = "Глубина просмотра";
    this._metrics_dict["ym:s:robotPercentage"] = "Роботность";
  }

  get_metrics(date1, date2, group, metrics, dimensions, filters = '') {
    var thisYaMetrics = this;
    return new Promise(function(resolve, reject) {

      helpers.logger('YaMetrics.get_metrics', thisYaMetrics.id + ' @ ' + date1 + ' ' + date2);
      helpers.logger('YaMetrics.get_metrics', group + ' ' + metrics + ' ' + dimensions + ' ' + filters);

      var req_url = thisYaMetrics._create_request_url(date1, date2, group, metrics, dimensions, filters);

      helpers.send_request(thisYaMetrics._api_host, req_url)
      .then(function(response) {
        var result = JSON.parse(response);
        if(result.data == null) {
          reject('Status ' + result.code + ' | ' + result.message);
        }

        helpers.logger('YaMetrics.get_metrics', 'Response is good');
        thisYaMetrics._data_raw = result;
        thisYaMetrics._create_updates_for_week_objects(metrics, filters);
        return thisYaMetrics._update_week_objects();
      })
      .then(function(counted) {
        helpers.logger('YaMetrics.get_metrics', 'Updated ' + counted + ' week objects');
        resolve(counted);
      })
      .catch(function(error) {
        reject(error);
      })

    });

  }

  _create_request_url(date1, date2, group, metrics, dimensions, filters) {

    var req_url = this._api_url_base;
    req_url += 'data/bytime?metrics=' + metrics.join(",") + '&date1=' + date1 + '&date2=' + date2;
    req_url += '&group=' + group + '&dimensions=' + dimensions.join(",");
    req_url += '&filters=' + filters;
    req_url += '&ids=' + this.id + '&oauth_token=' + this.api_token;
    return req_url;

  }

  _create_week_objects(metrics, filters) {

    helpers.logger('YaMetrics._create_week_objects', 'Creating week objects');
    var weekObjects = [];
    this._data_raw['time_intervals'].forEach(function(interval, i, intervals) {

      var week1start = moment(interval[0]).startOf('week');
      var day1index = moment(interval[0]).weekday();
      var week2start = moment(interval[1]).startOf('week');
      var day2index = moment(interval[1]).weekday();
      var diff = week2start.diff(week1start, 'weeks');
      for(var j = 0; j <= diff; j++) {
        data['data'].forEach(function(dat, k, data) {
          params.metrics.forEach(function(metric, m, metrics) {

            var week = {
              timestamp: week1start.add(j, 'weeks').toDate(),
              id: this.metricsId,
              metric: params.metrics_dict[metric],
              dimension: dat['dimensions'].length > 0 ? dat['dimensions'][m]['name'] : 'Итого/Среднее',
              filters: filters
            };
            var exists = weekObjects.filter(function(obj) {
              return obj.timestamp.getTime() == week.timestamp.getTime()
                  && obj.metricsId == week.metricsId
                  && obj.metric == week.metric
                  && obj.dimension == week.dimension
                  && obj.filters == week.filters;
            });
            if(!exists.length) {
              weekObjects.push(week);
            }

          });
        });
      }

    });
    return weekObjects;

  }

  _create_updates_for_week_objects(metrics, filters) {
    var thisYaMetrics = this;
    thisYaMetrics._data_to_store = [];

    thisYaMetrics._data_raw['time_intervals'].forEach(function(interval, i, intervals) {
      var week1start = moment(interval[0]).startOf('week');
      var day1index = moment(interval[0]).weekday();
      var week2start = moment(interval[1]).startOf('week');
      var day2index = moment(interval[1]).weekday();
      var diff = week2start.diff(week1start, 'weeks');

      for(var t = 0; t <= diff; t++) {
        thisYaMetrics._data_raw['data'].forEach(function(dat, k, data) {
          metrics.forEach(function(metric, m, metrics) {
            var week = {
              timestamp: week1start.add(t, 'weeks').toDate(),
              id: thisYaMetrics.metricsId,
              metric: thisYaMetrics._metrics_dict[metric],
              dimension: dat['dimensions'].length > 0 ? dat['dimensions'][m]['name'] : 'Итого/Среднее',
              filters: filters
            };

            thisYaMetrics._data_to_store.push({
              find: week,
              query: {
                $pull: { values: { dayOfWeek: day1index }}
              }
            });
            thisYaMetrics._data_to_store.push({
              find: week,
              query: {
                $push: { values: { dayOfWeek: day1index, value: dat['metrics'][m][i]}}
              }
            });
          });
        });
      }
    });

  }

  _update_week_objects() {
    var thisYaMetrics = this;
    return new Promise(function (resolve, reject) {
      helpers.logger('YaMetrics._update_week_objects', 
                     'Need to update ' + thisYaMetrics._data_to_store.length + ' week objects');


      DataWeekModel.bulkFindUpdate(thisYaMetrics._data_to_store, function(err, results) {
        if(err) {
          helpers.logger('YaMetrics._update_week_objects', 'Error occured: ' + err);
          reject(err);
        } else {
          helpers.logger('YaMetrics._update_week_objects', 'Success');
          resolve(thisYaMetrics._data_to_store.length);
        }
      });
    });
  }

}

module.exports = YaMetrics;