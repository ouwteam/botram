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

var AppContext = {
    QRBucket: []
};

var connectionMananger = new ConnectionMananger();
var routeRegistration = new RouteRegistration(connectionMananger, cfg, AppContext, util);
var routeMain = new RouteMain(connectionMananger, cfg, AppContext, QRCode);
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

//get client device information
app.get('/api/device', routeMain.handleDevice.bind(routeMain));
app.post('/api/device', routeMain.handleDevice.bind(routeMain));

//get qrcode 
app.get('/api/qr', routeMain.handleScanner.bind(routeMain));

//reset will remove session so we need to scan new qrcode
//reset will make some downtime
app.post('/api/device/reset', function (req, res) {
    if (fs.existsSync(SESSION_FILE_PATH) == false || routeMain.clientReady == false) {
        res.setHeader('Content-Type', 'Application/Json');
        res.send(JSON.stringify({
            info: false,
            status: 'Reset a non ready client is illegal.'
        }));

        return;
    }

    console.log('Shuting down the client..');
    // remove current session file
    fs.unlinkSync(SESSION_FILE_PATH);
    sessionCfg = null;

    //the best solution for reseting client is reset the container it self
    process.exit(1);
});

//use this endpoint to check server status after reseting
app.get('/api/health', function (req, res) {
    res.setHeader('Content-Type', 'Application/Json');
    res.send(JSON.stringify({
        info: true,
        status: 'server is up'
    }));
});

//use this endpoint to check server status after reseting
app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'Application/Json');
    res.send(JSON.stringify({
        info: true,
        status: 'server is up'
    }));
});

app.get('/api/list-user', function (req, res) {
    res.setHeader('Content-Type', 'Application/Json');
    res.send(JSON.stringify({
        info: true,
        data: extractClient(ConnectedClient)
    }));
});

function generateID(phone) {
    return phone + "@c.us";
}

function extractClient(ConnectedClient) {
    var o = [];
    for (k in ConnectedClient) {
        o.push(k);
    }

    return o;
}

function removeClient(USER_ID) {
    delete ConnectedClient[USER_ID];
}

app.listen(process.env.PORT, process.env.LISTEN_ADDR, () => console.log(`listening at http://${process.env.LISTEN_ADDR}:${process.env.PORT}`));