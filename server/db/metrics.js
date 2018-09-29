const Metrics = require('../models/Metrics')
const MetricsGroup = require('../models/MetricsGroup')

const getMetrics = (user) => {
  return new Promise((resolve, reject) => {
    Metrics.find({
      owner: user.username
    }).exec()
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

const getAllMetrics = () => {
  return new Promise((resolve, reject) => {
    Metrics.find({}).exec()
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

const getMetricsById = (_id) => {
  return new Promise((resolve, reject) => {
    Metrics.findById(_id, (err, metrics) => {
      if (err) {
        return reject(err);
      }
      return resolve(metrics);
    })
  })
}

const insertMetrics = (metrics) => {
  return new Promise((resolve, reject) => {
    const metricsObj = new Metrics(metrics)
    metricsObj.save()
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

const updateMetrics = (_id, updates) => {
  return new Promise((resolve, reject) => {
    Metrics.findOneAndUpdate(
      { _id: _id },
      updates,
      { new: true }
    ).exec()
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

const removeMetrics = (_id) => {
  return new Promise((resolve, reject) => {
    Metrics.remove({
      _id: _id
    }).exec()
      .then(() => resolve(null))
      .catch(err => reject(err))
  })
}

const getMetricsByGroupId = (user, _id) => {
  return new Promise((resolve, reject) => {
    Metrics.find({
      owner: user.username,
      groupIds: { $all: [_id] }
    }).exec()
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

const getMetricsGroups = (user) => {
  return new Promise((resolve, reject) => {
    MetricsGroup.find({ owner: user.username }, (err, data) => {
      if (!err) {
        resolve(data)
      } else {
        reject(err)
      }
    })
  })
}

const insertMetricsGroup = (user, metricsGroup) => {
  return new Promise((resolve, reject) => {
    const newMetricsGroup = new MetricsGroup({
      owner: user.username,
      name: metricsGroup.name
    })
    newMetricsGroup.save()
      .then(insertedGroup => {

        const queries = metricsGroup.metrics.map(metrics => ({
          find: { _id: metrics._id },
          update: { $push: { groupIds: newMetricsGroup._id } }
        }))
        Metrics.bulkFindAndUpdate(queries)
          .then(() => resolve(insertedGroup))
          .catch(err => reject(err))
        
      })
      .catch(err => reject(err))
  })
}

const updateMetricsGroup = (user, metricsGroup) => {
  
}

const removeMetricsGroup = (user, metricsGroupId) => {

}

module.exports = {
  getMetrics, getAllMetrics, getMetricsById,
  insertMetrics, updateMetrics, removeMetrics,
  getMetricsByGroupId, getMetricsGroups, insertMetricsGroup,
  updateMetricsGroup, removeMetricsGroup
}