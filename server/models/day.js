var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Day = new Schema({
  dayOfWeek: {type: Number, required: true },
  value: { type: Number, default: 0.0 }
});

var DayModel = mongoose.model('Day', Day);

module.exports.DayModel = DayModel;