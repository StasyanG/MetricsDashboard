var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var DayModel = require('./day').DayModel;

var DataWeek = new Schema({
    timestamp: {type: Date, required: true},
    id: { type: String, required: true },
    metric: { type: String, required: true },
    dimension: { type: String, required: true },
    filters: { type: String, default: '' },
    values: [DayModel.schema],
    num_samples: { type: Number, default: 0 },
    total_samples: { type: Number, default: 0.0 }
});

// Creating unique index
// 1 is for Ascending
DataWeek.index({ 
    timestamp: 1,
    id: 1,
    metric: 1,
    dimension: 1,
    filters: 1
}, { unique: true });

/* Thanks to https://gist.github.com/dbrugne/2a62d4dd88f11fa36b75 */
DataWeek.statics.bulkInsert = function(models, fn) {
    if (!models || !models.length)
        return fn(null);

    var bulk = this.collection.initializeUnorderedBulkOp();
    if (!bulk)
        return fn('bulkInsertModels: MongoDb connection is not yet established');

    var model;
    for (var i=0; i<models.length; i++) {
        model = models[i];
        bulk.insert(model.toJSON());
    }

    bulk.execute(fn);
};

DataWeek.statics.bulkFindUpdate = function(queries, fn) {
    if(!queries || !queries.length)
        return fn(null);
    
    var bulk = this.collection.initializeUnorderedBulkOp();
    if (!bulk)
        return fn('bulkInsertModels: MongoDb connection is not yet established');
    
    queries.forEach(function(query, i, queries) {
        bulk.find( query['find'] ).upsert().updateOne( query['query'] );
    });
    
    bulk.execute(fn);
}

var DataWeekModel = mongoose.model('DataWeek', DataWeek);

module.exports = DataWeekModel;