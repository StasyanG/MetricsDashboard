# MetricsDashboard

__WARNING!__ This README is outdated. And the project won't receive any updates in the future.

## Description
A system to monitor websites' effectiveness

### Features
- Getting data from Yandex.Metrika counters with API
- Getting data from custom CSV files

### Architecture
The system is two Node.js applications: server and web application.
The server is responsible for requests to database (MongoDB) and manipulation of data.
Database connection string can be configured in the following files: _server/config/dev.js_ and _server/config/prod.js_. If environment variable MONGO_CONN_STRING exists, the system will use it instead of values provided in configuration files.
Vue.js application is created using [vue-webpack-boilerplate](https://github.com/vuejs-templates/webpack).

## Requirements
- MongoDB
- Node.js

## Usage
### Important note!!
For the web application to function correctly it is needed to replace server address (API_URL) in the following configuration files: _app/config/dev.env.js_ and _app/config/prod.env.js_.
### server/data
To be able to get data from Yandex.Metrika counters you should create a file server/data/counters.txt and fill it with counter information (one line per counter):
```
<WEBSITE NAME> Yandex <COUNTER_ID> <API_TOKEN>
```
For LiveInternet the line should look like this:
```
example.com LiveInternet
```
### Installation and start
To install and start server and web application use the following commands:
```
cd server
npm install
npm start
```
```
cd app
npm install
npm run dev OR npm run build
```
### docker-compose
You can use docker-compose to start server and web application. Sample docker-compose.yml is provided in the root of this repository.
