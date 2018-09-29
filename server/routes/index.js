const fs = require('fs');
const express = require('express');
const router = express.Router();
const moment = require('moment');
const request = require('request');
const csv = require('fast-csv');
const get = require('../get');
const upload = require('../upload');
const helpers = require('../helpers');
const CSVOrders = require('../classes/CSVOrders')

const localCode = process.env.LOCAL_SECRET || null;

const auth = require('./auth');
const dbMetrics = require('../db/metrics')
const dbAccounts = require('../db/accounts')
const DataWeekModel = require('../models/data_week')
const CustomWeekModel = require('../models/custom_week')

const getAccountCounters = (account) => {
  return new Promise((resolve, reject) => {
    switch(account.provider) {
      case 'Yandex':
        request({
          url: 'https://api-metrika.yandex.ru/management/v1/counters',
          method: 'GET',
          headers: { 'Authorization': `OAuth ${account.oauthAccessToken}` }
        }, (err, _, body) => {
          const data = JSON.parse(body);
          if (err || data.errors) {
            console.log('error');
            return reject(err || new Error(data.message));
          }
          resolve(data);
        });
        return;
      default:
        const err = new Error('Invalid account provider');
        reject(err);
    }
  })
}

module.exports = (passport) => {
  const requireAuth = passport.authenticate('jwt', { session: false });
  const requireLocalAuth = (req, res, next) => {
    if(!localCode || !req.headers['x-localauth'] || localCode != req.headers['x-localauth']) {
        return res.sendStatus(401);
    }
    next();
  };

  router.get('/', (req, res, next) => {
    res.render('index');
  });

  router.post('/auth/login', auth.login);
  router.post('/auth/signup', auth.signup);
  router.post('/auth/logout', auth.logout);
  router.get('/auth/yandex/request', auth.yandex_oauthRequest);
  router.post('/auth/yandex/authorize', requireAuth, auth.yandex_autorize);

  // TODO: REMOVE AFTER DEVELOPMENT AND TESTING OF AUTHORIZATION
  router.get('/auth/setup', auth.setup);
  // router.get('/auth/reset', (req, res, next) => {
  //   User.remove({}, function() {
  //     res.send('Removed all users');
  //   });
  // });
  // /TODO

  router.get('/local_metrics_update/:date1/:date2', requireLocalAuth, (req, res, next) => {
    get.get_data(res, req.params.date1, req.params.date2);
  });

  router.all('/api/*', requireAuth, (req, res, next) => {
		next();
  });

  router.get('/api/providers', (req, res, next) => {
    return res.send({
        status: 'OK',
        data: [{
            name: 'Yandex',
            authMethods: [ 'oauth' ]
        }]
    })
  })

  router.get('/api/accounts', async (req, res, next) => {
    try {
      const accounts = await dbAccounts.getAccounts(req.user)
      return res.send({
        status: 'OK',
        data: accounts
      })
    } catch(e) {
      return next(e)
    }
  })

  router.post('/api/accounts', async (req, res, next) => {
    if(!req.body.provider || !req.body.authMethod || !req.body.username) {
      const e = new Error('Provide provider, authMethod and username');
      return next(e)
    }
    try {
      const inserted = await dbAccounts.insertAccount({
        owner: req.user.username,
        ...req.body
      })
      return res.send({
        status: 'OK',
        data: inserted
      })
    } catch(e) {
      return next(e)
    }
  })

  router.get('/api/accounts/:id/counters', async (req, res, next) => {
    try {
      const account = await dbAccounts.getAccount(req.params.id);
      const counters = await getAccountCounters(account);
      res.send({
        status: 'OK',
        data: counters
      })
    } catch(e) {
      return next(e);
    }
  })
  
  router.get('/api/metrics', async (req, res, next) => {
    try {
      const metrics = await dbMetrics.getMetrics(req.user)
      return res.send({
        status: 'OK',
        data: metrics
      })
    } catch(e) {
      return next(e)
    }
  })

  router.post('/api/metrics', async (req, res, next) => {
    if(!req.body.accountId || !req.body.id || !req.body.name || !req.body.updateFreq) {
      const e = new Error('Provide accountId, id, name and updateFreq');
      return next(e);
    }
    try {
      const inserted = await dbMetrics.insertMetrics({
        owner: req.user.username,
        accountId: req.body.accountId,
        id: req.body.id,
        name: req.body.name,
        updateFreq: req.body.updateFreq
      })
      return res.send({
        status: 'OK',
        data: inserted
      })
    } catch(e) {
      return next(e)
    }
    
  })

  router.delete('/api/metrics/:id', async (req, res, next) => {
    try {
      await dbMetrics.removeMetrics(req.params.id)
      return res.send({ status: 'OK' })
    } catch(e) {
      return next(e)
    }
  })

  router.get('/api/metrics_groups', (req, res, next) => {

  })

  router.get('/api/get/:date1/:date2', (req, res, next) => {
    get.get_data(res, req.params.date1, req.params.date2);
  });
  router.get('/api/get/:date1/:date2/:id', (req, res, next) => {
    get.get_data(res, req.params.date1, req.params.date2, 
      req.params.id);
  });
  router.get('/api/data', (req, res, next) => {
    const id = req.query.id;
    const date1 = req.query.date1;
    const date2 = req.query.date2;
    const granularity = req.query.gran || 'days';
    if(!id || !date1 || !date2) {
      return res.send({
        status: 'ERROR',
        msg: 'Invalid query (not enough parameters)'
      });
    }

    let resultData = [];

    let query = {
      id,
      timestamp: { 
        $gte: moment(date1).startOf('week').toDate(),
        $lte: moment(date2).startOf('week').toDate()
      }
    };
    query = DataWeekModel.find(query);
    query.exec()
    .then(function(data) {
      resultData = data;
      query = CustomWeekModel.find({
        id,
        timestamp: { 
          $gte: moment(date1).startOf('week').toDate(),
          $lte: moment(date2).startOf('week').toDate()
        }
      });
      return query.exec();
    })
    .then(function(data) {
      resultData = resultData.concat(data);
      return res.send({ 
        status: 'OK', 
        data: helpers.generateGraphData(resultData, granularity)
      });
    })
    .catch(function(err) {
      res.statusCode = 500;
      console.log('Internal error(' + res.statusCode + '): ' + err.message);
      return res.send({ error: 'Server error', desc: 'Unable to get data' });
    });
  });
  router.post('/api/upload', (req, res, next) => {
    upload.uploadFile(req, res);
  });
  router.all('/api/procfile', (req, res, next) => {
    const filepath = req.body.filepath;
    if(!filepath) {
      return res.send({
        status: 'ERROR',
        msg: 'Invalid query (not enough parameters)'
      });
    }
    if (fs.existsSync(filepath)) {
      let dataRows = [];

      const stream = fs.createReadStream(filepath);
      const csvStream = csv({delimiter: ';'})
      .on("data", function(data){
        dataRows.push(data);
      })
      .on("end", function(){
        const csvOrders = new CSVOrders(dataRows);

        const csvProcErrors = csvOrders.procCSVRows();
        if(csvProcErrors) {
          helpers.logger('/api/procfile', csvProcErrors.toString());
          return res.send({
            status: 'ERROR',
            msg: csvProcErrors.toString()
          });
        }

        csvOrders.storeData()
        .then(function() {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
          console.log('CSV Processing Complete / Updated db data');
          return res.send({
            status: 'OK',
            data: 'Updated Orders data'
          });
        })
        .catch(function(err) {
          helpers.logger('/api/procfile', err);
          return res.send({
            status: 'ERROR',
            msg: err
          });
        });
      });
      stream.pipe(csvStream);
    } else {
      return res.send({
        status: 'ERROR',
        msg: 'No such file or directory'
      });
    }
  });
  router.get('/view', (req, res, next) => {
    return DataWeekModel.find(function (err, data) {
			if (!err) {
  return res.send({ 
  	status: 'OK', 
  	data: data
  });
			} else {
  res.statusCode = 500;
  console.log('Internal error(' + res.statusCode + '): ' + err.message);
  return res.send({ error: 'Server error', desc: 'Unable to get metrics' });
			}
		});
  });
  router.get('/api/cleanup', (req, res, next) => {
    return DataWeekModel.remove({}, function (err) {
			if (!err) {
  return res.redirect('/view');
			} else {
  res.statusCode = 500;
  console.log('Internal error(' + res.statusCode + '): ' + err.message);
  return res.send({ error: 'Server error', desc: '[MetricsData] Unable to remove all' });
			}
		});
  });
  router.get('/view2', (req, res, next) => {
    return CustomWeekModel.find(function (err, data) {
			if (!err) {
  return res.send({ 
  	status: 'OK', 
  	data: data
  });
			} else {
  res.statusCode = 500;
  console.log('Internal error(' + res.statusCode + '): ' + err.message);
  return res.send({ error: 'Server error', desc: 'Unable to get metrics' });
			}
		});
  });
  router.get('/api/cleanup2', (req, res, next) => {
    return CustomWeekModel.remove({}, function (err) {
			if (!err) {
  return res.redirect('/view2');
			} else {
  res.statusCode = 500;
  console.log('Internal error(' + res.statusCode + '): ' + err.message);
  return res.send({ error: 'Server error', desc: '[MetricsData] Unable to remove all' });
			}
		});
  });

  return router;
}