const fs = require('fs');

module.exports = class Device {
    constructor(ConnectionMananger, Config, AppContext) {
        this.ConnectionMananger = ConnectionMananger;
        this.Config = Config;
        this.AppContext = AppContext;
    }

    HandleReset(req, res) {
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
    }

    handleDevice(req, res) {
        var state = null,
            webVersion = null,
            querySTR = req.query;

        if (typeof querySTR.cl == 'undefined') {
            res.setHeader("Content-Type", "Application/Json");
            res.status(200).send({
                info: false,
                status_code: this.Config.status_code.MISSING_REQUIRED_ARGS,
                status: "CL is required"
            });
        }

        var USER_ID = this.ConnectionMananger.GenerateID(querySTR.cl);
        if (!this.ConnectionMananger.IsClientExists(USER_ID)) {
            res.setHeader('Content-Type', 'Application/Json');
            res.send({
                info: false,
                status_code: this.Config.status_code.CLIENT_IS_NOT_EXISTS,
                status: 'Client is not exists'
            });
            return;
        }

        if (this.ConnectionMananger.IsClientReady(USER_ID) == false) {
            res.setHeader('Content-Type', 'Application/Json');
            res.send({
                info: false,
                status_code: this.Config.status_code.CLIENT_IS_NOT_READY,
                status: 'Client is not ready'
            });

            return;
        }

        var mConnectionManager = this.ConnectionMananger;
        mConnectionManager.GetClient(USER_ID).getState().then(function (result) {
            state = result;
            mConnectionManager.GetClient(USER_ID).getWWebVersion().then(function (result) {
                webVersion = result;

                res.setHeader('Content-Type', 'Application/Json');
                res.send({
                    info: true,
                    state: state,
                    webVersion: webVersion,
                    device: mConnectionManager.GetClient(USER_ID).info
                });
            });
        });
    }

}