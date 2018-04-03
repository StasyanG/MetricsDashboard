var moment = require('moment');
moment.locale('ru');

const helpers = require('../helpers');
const MetricsWeekModel = require('../models/metric_week').MetricsWeekModel;

class LiveInternet {
  constructor(cname) {
    this.name = cname;

    this._data_raw = null;
    this._data_to_store = null;

    this._api_host = 'http://counter.yadro.ru';
    this._api_url_base = '/values?site=';

    this._metrics_dict = {};
    this._metrics_dict["LI_today_hit"] = "[LI] Просмотры";
    this._metrics_dict["LI_today_vis"] = "[LI] Посетители";
  }

  get_metrics() {
    var thisLiveInternet = this;
    return new Promise(function(resolve, reject) {

      helpers.logger('LiveInternet.get_metrics', thisLiveInternet.name + ' @ today');

      var req_url = thisLiveInternet._api_url_base + thisLiveInternet.name;

      helpers.send_request(thisLiveInternet._api_host, req_url, 'http')
      .then(function(response) {
        var result = response.toString().split(';\r\n');

        helpers.logger('LiveInternet.get_metrics', 'Response is good');
        helpers.logger('LiveInternet.get_metrics', result);
        thisLiveInternet._data_raw = result;
        thisLiveInternet._create_updates_for_week_objects();
        return thisLiveInternet._update_week_objects();
      })
      .then(function(counted) {
        helpers.logger('LiveInternet.get_metrics', 'Updated ' + counted + ' week objects');
        resolve(counted);
      })
      .catch(function(error) {
        reject(error);
      })

    });

  }

  _create_updates_for_week_objects() {
    var thisLiveInternet = this;

    thisLiveInternet._data_to_store = [];
    thisLiveInternet._data_raw.forEach(function(item, i, items) {
      var parts = item.split(' = ');
      var key = parts[0];
      var value = parts[1];
      for (var metric_key in thisLiveInternet._metrics_dict) {
        if (thisLiveInternet._metrics_dict.hasOwnProperty(metric_key)) {
          if(metric_key == key) {
            var week = {
              timestamp: moment().startOf('week').toDate(),
              type: 'LiveInternet',
              name: thisLiveInternet.name,
              metric: thisLiveInternet._metrics_dict[metric_key],
              dimension: '',
              filters: ''
            };

            thisLiveInternet._data_to_store.push({
              find: week,
              query: {
                $pull: { values: { dayOfWeek: moment().isoWeekday() - 1 }}
              }
            });
            thisLiveInternet._data_to_store.push({
              find: week,
              query: {
                $push: { values: { dayOfWeek: moment().isoWeekday() - 1, value: value}}
              }
            });
          }
        }
      }
    });
  }

  _update_week_objects() {
    var thisLiveInternet = this;
    return new Promise(function (resolve, reject) {
      helpers.logger('LiveInternet._update_week_objects', 
                     'Need to update ' + thisLiveInternet._data_to_store.length + ' week objects');


      MetricsWeekModel.bulkFindUpdate(thisLiveInternet._data_to_store, function(err, results) {
        if(err) {
          helpers.logger('LiveInternet._update_week_objects', 'Error occured: ' + err);
          reject(err);
        } else {
          helpers.logger('LiveInternet._update_week_objects', 'Success');
          resolve(thisLiveInternet._data_to_store.length);
        }
      });
    });
  }
}

module.exports = LiveInternet;
