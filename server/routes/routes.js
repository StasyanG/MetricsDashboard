const fs = require('fs');
const express = require('express');
var router = express.Router();
const moment = require('moment');
const csv = require('fast-csv');
var get = require('../get');
var upload = require('../upload');
var helpers = require('../helpers');
var CSVOrders = require('../classes/CSVOrders')

var env = process.env.NODE_ENV || '';

var MetricsWeekModel = require('../models/metric_week').MetricsWeekModel;
var CustomWeekModel = require('../models/custom_week').CustomWeekModel;
var User = require('../models/user').UserModel;

const auth = require('./auth');

module.exports = function (app, passport) {

    router.get('/', function (req, res, next) {
        res.render('index');
    });

    router.post('/auth/login', auth.login(User));
    router.post('/auth/signup', auth.signup(User));

    // TODO: REMOVE AFTER DEVELOPMENT AND TESTING OF AUTHORIZATION
    router.get('/auth/setup', auth.setup(User));
    router.get('/auth/reset', function(req, res, next) {
        User.remove({}, function() {
            res.send('Removed all users');
        });
    });
    router.get('/auth/listUsers',
        passport.authenticate('jwt', { session: false }),
        auth.listUsers(User, app.get('jwt_secret'))
    );
    // /TODO

    router.get('/api/*', function (req, res, next) {
		next();
	});
    router.get('/api/counters', function(req, res, next) {
        get.get_counters(res);
    });
    router.get('/api/get/:date1/:date2', function(req, res, next) {
        get.get_data(res, req.params.date1, req.params.date2);
    });
    router.get('/api/get/:date1/:date2/:name', function(req, res, next) {
        get.get_data(res, req.params.date1, req.params.date2, 
            req.params.name);
    });
    router.get('/api/get/:date1/:date2/:name/:type', function(req, res, next) {
        get.get_data(res, req.params.date1, req.params.date2, 
            req.params.name, req.params.type);
    });
    router.get('/api/data', function(req, res, next) {
        var name = req.query.name;
        var type = req.query.type;
        var date1 = req.query.date1;
        var date2 = req.query.date2;
        var granularity = req.query.gran || 'days';
        if(!name || !date1 || !date2) {
            return res.send({
                status: 'ERROR',
                msg: 'Invalid query (not enough parameters)'
            });
        }

        var resultData = [];

        var query = {
            name: name,
            timestamp: { 
                $gte: moment(date1).startOf('week').toDate(),
                $lte: moment(date2).startOf('week').toDate()
            }
        };
        if(type) {
            query.type = type;
        }
        query = MetricsWeekModel.find(query);
        query.exec()
        .then(function(data) {
            resultData = data;
            query = CustomWeekModel.find({
                name: name,
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
    router.post('/api/upload', function(req, res, next) {
        upload.uploadFile(req, res);
    });
    router.all('/api/procfile', function(req, res, next) {
        var filepath = req.body.filepath;
        if(!filepath) {
            return res.send({
                status: 'ERROR',
                msg: 'Invalid query (not enough parameters)'
            });
        }
        if (fs.existsSync(filepath)) {
            var dataRows = [];

            var stream = fs.createReadStream(filepath);
            var csvStream = csv({delimiter: ';'})
            .on("data", function(data){
                dataRows.push(data);
            })
            .on("end", function(){
                var csvOrders = new CSVOrders(dataRows);

                var csvProcErrors = csvOrders.procCSVRows();
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
    router.get('/view', function(req, res, next) {
        return MetricsWeekModel.find(function (err, data) {
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
    router.get('/api/cleanup', function(req, res, next) {
        return MetricsWeekModel.remove({}, function (err) {
			if (!err) {
				return res.redirect('/view');
			} else {
				res.statusCode = 500;
				console.log('Internal error(' + res.statusCode + '): ' + err.message);
				return res.send({ error: 'Server error', desc: '[MetricsData] Unable to remove all' });
			}
		});
    });
    router.get('/view2', function(req, res, next) {
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
    router.get('/api/cleanup2', function(req, res, next) {
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

    router.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });
    router.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: (env === 'dev' ? err : '')
        });
    });

    return router;
}