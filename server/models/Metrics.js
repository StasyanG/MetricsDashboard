const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Metrics = new Schema({
  owner: { type: String, required: true },
  accountId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  updateFreq: { type: String, default: '1d' },
  lastUpdated: { type: Date },
  groupIds: [{ type: String }]
});

// Creating unique index
// 1 is for Ascending
Metrics.index({
  owner: 1,
  accountId: 1,
  id: 1
}, { unique: true });

Metrics.statics.bulkFindAndUpdate = (queries) => {
  if(!queries || !queries.length)
    return Promise.reject('Metrics: Invalid queries')
  
  const bulk = this.collection.initializeUnorderedBulkOp()
  if (!bulk)
    return Promise.reject('Metrics: Unable to initialize bulk')
  
  queries.forEach((query) => {
    bulk.find( query['find'] ).upsert().updateOne( query['update'] )
  })
  
  return bulk.execute()
}

const MetricsModel = mongoose.model('Metrics', Metrics);

module.exports = MetricsModel;