var moment = require('moment');
moment.locale('ru');

var helpers = require('../helpers');
var CustomWeekModel = require('../models/custom_week').CustomWeekModel;

class CSVOrders {
  constructor(dataRows) {
    this._rawData = dataRows;
    this._procData = [];
  }

  procCSVRows() {
    if(!this._rawData)
      return;
    var thisObj = this;
    var rowCount = this._rawData.length;
    var errors = [];
    this._rawData.forEach(function(row, i, rows) {
      if(i == 0) { // head
        return true;
      }
      // Check for row length
      if(row.length < 16) {
        errors.push('Invalid file');
        return false;
      }
      var date = row[3];
      var weekStart = moment(date, "DD.MM.YYYY").startOf('week');
      var dayIndex = moment(date, "DD.MM.YYYY").weekday();

      var name = row[4];
      var sum_order = row[12] != '' ? parseFloat(row[12].replace(',', '.')) : 0.0;
      var sum_paid = row[14] != '' ? parseFloat(row[14].replace(',', '.')): 0.0;
      var sum_total = row[15] != '' ? parseInt(row[15]) : 0;
      var sum_items = row[16] != '' ? parseInt(row[16]) : 0;
      var paid = (sum_paid != 0) ? 1 : 0;

      helpers.logger('CSVOrders.procCSVRows', '[row ' + (i+1) + '/' + rowCount + '] Processing ' + name + ' ' + date);

      thisObj._procValue(weekStart, dayIndex, name, 'Заказы', 'Оплаченные', paid);
      thisObj._procValue(weekStart, dayIndex, name, 'Заказы', 'Неоплаченные', +!paid);
      thisObj._procValue(weekStart, dayIndex, name, 'Заказы', 'Сумма итого', sum_order);
      thisObj._procValue(weekStart, dayIndex, name, 'Заказы', 'Сумма оплат', sum_paid);
      thisObj._procValue(weekStart, dayIndex, name, 'Заказы', 'Кол-во номенклатуры', sum_total);
      thisObj._procValue(weekStart, dayIndex, name, 'Заказы', 'Кол-во позиций', sum_items);
    });
    if(!errors.length) {
      return false;
    } else {
      return errors;
    }
  }
  storeData() {
    var thisObj = this;
    return new Promise(function (resolve, reject) {
      helpers.logger('CSVOrders.storeData', 
                     'Need to do ' + thisObj._procData.length + ' updates');

      var chunks = helpers.splitArrayIntoChunks(thisObj._procData, 1000);
      var length = chunks.length;
      helpers.logger('CSVOrders.storeData', 'Divided into ' + length + ' chunks');

      var count = 0;
      chunks.forEach(function(chunk, i, chunks) {
        helpers.logger('CSVOrders.storeData', 'Chunk #' + (count+1));
        CustomWeekModel.bulkFindUpdate(chunk, function(err, results) {
          if(err) {
            helpers.logger('CSVOrders.storeData', 'Error occured: ' + err);
            reject(err);
          } else {
            count++;
            helpers.logger('CSVOrders.storeData', 'Success (' + count + '/' + length + ')');
            if(count >= length)
              resolve(thisObj._procData.length);
          }
        });
      });
    });
  }

  _procValue(weekStart, dayIndex, name, metric, dimension, value) {
    var found = this._procData.filter(function(obj) {
      return obj.find.timestamp.getTime() == weekStart.toDate().getTime()
          && obj.find.name == name
          && obj.find.metric == metric
          && obj.find.dimension == dimension;
    });
    var week = {
      timestamp: weekStart.toDate(),
      name: name,
      metric: metric,
      dimension: dimension
    }
    if(!found.length) {
      this._procData.push({
        find: week,
        query: {
          $pull: { values: { dayOfWeek: dayIndex }}
        }
      });
      this._procData.push({
        find: week,
        query: {
          $push: { values: { dayOfWeek: dayIndex, value: value}}
        }
      });
    } else {
      var flag = 0;
      found.forEach(function(item, i, data) {
        var push_query = item.query.$push;
        if(!push_query)
          return true;
        if(push_query.values.dayOfWeek == dayIndex) {
          data[i].query.$push.values.value += value;
          flag = 1;
          return false;
        }
      });
      if(!flag) {
        this._procData.push({
          find: week,
          query: {
            $pull: { values: { dayOfWeek: dayIndex }}
          }
        });
        this._procData.push({
          find: week,
          query: {
            $push: { values: { dayOfWeek: dayIndex, value: value}}
          }
        });
      }
    }
  }
}

module.exports = CSVOrders;