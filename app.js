require('dotenv').config()
const fs = require('fs');
const util = require('util');
const express = require('express');
const RouteMain = require('./src/http/route-main');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
const cfg = require('./src/lib/constant');
const ConnectionMananger = require('./src/Manager/ConnectionManager');
const RouteRegistration = require('./src/http/Controller/Registration');
const Device = require('./src/http/Controller/Device');

var AppContext = {
    QRBucket: []
};

var connectionMananger = new ConnectionMananger();
var routeRegistration = new RouteRegistration(connectionMananger, cfg, AppContext, util);
var routeMain = new RouteMain(connectionMananger, cfg, AppContext, QRCode);
var routeDevice = new Device(connectionMananger, cfg, AppContext, QRCode);
var app = express();

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

// required a param : phone
app.get('/api/registration', routeRegistration.handleRegistration.bind(routeRegistration));

//define route request
//send text message, media message, see: https://github.com/barokurniawan/wabot-service/blob/master/README.md
app.get('/api/message', routeMain.handleIndex.bind(routeMain));
app.post('/api/message', routeMain.handleIndex.bind(routeMain));

//get qrcode 
app.get('/api/qr', routeMain.handleScanner.bind(routeMain));

//get client device information
app.get('/api/device', routeDevice.handleDevice.bind(routeDevice));
app.post('/api/device', routeDevice.handleDevice.bind(routeDevice));

//reset will remove session so we need to scan new qrcode
//reset will make some downtime
app.post('/api/device/reset', routeDevice.HandleReset.bind(routeDevice));

//use this endpoint to check server status after reseting
app.get('/', routeMain.handleMain.bind(routeMain));

app.get('/api/list-user', routeMain.handleListUser.bind(routeMain));

app.listen(process.env.PORT, process.env.LISTEN_ADDR, () => console.log(`listening at http://${process.env.LISTEN_ADDR}:${process.env.PORT}`));