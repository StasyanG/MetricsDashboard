var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Account = new Schema({
  owner: { type: String, required: true },
  provider: { type: String, required: true },
  username: { type: String, required: true },
  authMethod: { type: String, required: true, enum: ['none', 'oauth', 'apikey'] },
  oauthAccessToken: { type: String },
  oauthRefreshToken: { type: String },
  apiKey: { type: String }
});

// Creating unique index
// 1 is for Ascending
Account.index({
  owner: 1,
  provider: 1,
  username: 1
}, { unique: true });

var AccountModel = mongoose.model('Account', Account);

module.exports = AccountModel;