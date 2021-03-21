const { MessageMedia } = require('whatsapp-web.js');
const cfg = require('../../src/lib/constant');
const axios = require('axios').default;

const fileToBase64 = async function (file) {
    let image = await axios.get(file, { responseType: 'arraybuffer' });
    let returnedB64 = Buffer.from(image.data).toString('base64');

    return returnedB64;
}

module.exports = class RouteMain {

    constructor(ConnectionMananger, Config, AppContext, QRCode) {
        this.ConnectionMananger = ConnectionMananger;
        this.Config = Config;
        this.AppContext = AppContext;
        this.QRCode = QRCode;
    }

    async handleIndex(req, res) {
        var data = req.query;

        if (req.method == "POST") {
            data = req.body;
        }

        if (typeof data.cl == 'undefined') {
            res.setHeader("Content-Type", "Application/Json");
            res.status(200).send({
                info: false,
                status_code: cfg.status_code.MISSING_REQUIRED_ARGS,
                status: "CL is required"
            });
        }

        var USER_ID = this.ConnectionMananger.GenerateID(data.cl);
        if (!this.ConnectionMananger.IsClientExists(USER_ID)) {
            res.setHeader('Content-Type', 'Application/Json');
            res.send({
                info: false,
                status_code: cfg.status_code.CLIENT_IS_NOT_EXISTS,
                status: 'Client is not exists'
            });
            return;
        }

        res.setHeader('Content-Type', 'Application/Json');
        if (this.ConnectionMananger.IsClientReady(USER_ID) == false) {
            res.send({
                info: false,
                status_code: cfg.status_code.CLIENT_IS_NOT_READY,
                status: 'Client is not ready'
            });
            return;
        }

        if (typeof data.phone != "undefined") {
            if (typeof data.mime != "undefined" && typeof data.file != "undefined" && typeof data.filename != "undefined") {
                const chat = await this.ConnectionMananger.GetClient(USER_ID).getChatById(
                    this.ConnectionMananger.GenerateID(data.phone));
                chat.sendStateTyping();
                var media = new MessageMedia(data.mime, await fileToBase64(data.file), data.filename);

                if (data.message) {
                    this.ConnectionMananger.GetClient(USER_ID).sendMessage(this.ConnectionMananger.GenerateID(data.phone), media, {
                        caption: data.message
                    });
                } else {
                    this.ConnectionMananger.GetClient(USER_ID).sendMessage(this.ConnectionMananger.GenerateID(data.phone), media);
                }

                chat.clearState();
            } else {
                const chat = await this.ConnectionMananger.GetClient(USER_ID).getChatById(
                    this.ConnectionMananger.GenerateID(data.phone));
                chat.sendStateTyping();
                this.ConnectionMananger.GetClient(USER_ID).sendMessage(this.ConnectionMananger.GenerateID(data.phone), data.message);
                chat.clearState();
            }
        }

        res.send(JSON.stringify({
            info: true,
            status: 'send to queue',
            data: {
                message: data.message,
                target: data.phone
            }
        }));
    }

    async handleScanner(req, res) {
        var querySTR = req.query;
        if (typeof querySTR.cl == 'undefined') {
            res.setHeader("Content-Type", "Application/Json");
            res.status(200).send({
                info: false,
                status_code: cfg.status_code.MISSING_REQUIRED_ARGS,
                status: "CL is required"
            });
        }

        var USER_ID = this.ConnectionMananger.GenerateID(querySTR.cl);
        if (!this.ConnectionMananger.IsClientExists(USER_ID)) {
            res.setHeader('Content-Type', 'Application/Json');
            res.send({
                info: false,
                status_code: cfg.status_code.CLIENT_IS_NOT_EXISTS,
                status: 'Client is not exists'
            });
            return;
        }

        var qr = this.AppContext.QRBucket[USER_ID];
        if (!this.ConnectionMananger.IsClientReady(USER_ID)) {
            if (qr) {
                var base64 = await this.QRCode.toDataURL(qr);
                res.setHeader("Content-Type", "Application/Json");
                res.status(200).send({
                    info: true,
                    data: {
                        base64: base64
                    },
                    status_code: cfg.status_code.QRCODE_READY,
                    status: "QR is ready"
                });
            } else if (qr === null) {
                res.setHeader("Content-Type", "Application/Json");
                res.status(200).send({
                    info: false,
                    status_code: cfg.status_code.CLIENT_IS_NOT_EXISTS,
                    status: "Device is not registered"
                });
            }
        } else {
            res.setHeader("Content-Type", "Application/Json");
            res.status(200).send({
                info: false,
                status_code: cfg.status_code.CLIENT_CONNECTED,
                status: "Device is already connected"
            });
        }
    }

    handleMain(req, res) {
        res.setHeader('Content-Type', 'Application/Json');
        res.send({
            info: true,
            status: 'server is up'
        });
    }

    handleListUser(req, res) {
        res.setHeader('Content-Type', 'Application/Json');
        res.send({
            info: true,
            data: this.ConnectionMananger.GetClientReady()
        });
    }
}