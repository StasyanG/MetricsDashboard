var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Metrics = require('./Metrics');

var MetricsGroup = new Schema({
  owner: { type: String, required: true },
  name: { type: String, required: true },
});

// Creating unique index
// 1 is for Ascending
MetricsGroup.index({
  owner: 1,
  name: 1
}, { unique: true });

var MetricsGroupModel = mongoose.model('MetricsGroup', MetricsGroup);

module.exports = MetricsGroupModel;