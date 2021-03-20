const fs = require('fs');
const { Client } = require('whatsapp-web.js');

module.exports = class Registration {
    constructor(ConnectionMananger, Config, AppContext, util) {
        this.ConnectionMananger = ConnectionMananger;
        this.Config = Config;
        this.AppContext = AppContext;
        this.util = util;
    }

    async handleRegistration(req, res) {
        var querySTR = req.query;
        if (typeof querySTR.phone == 'undefined') {
            res.setHeader('Content-Type', 'Application/Json');
            res.send({
                info: false,
                status_code: this.Config.status_code.MISSING_REQUIRED_ARGS,

                status: 'Phone number is required to registration.'
            });

            return;
        }

        var USER_ID = this.ConnectionMananger.GenerateID(querySTR.phone);
        if (this.ConnectionMananger.IsClientExists(USER_ID)) {
            res.setHeader('Content-Type', 'Application/Json');
            res.send({
                info: false,
                status_code: this.Config.status_code.CLIENT_IS_REGISTERED,
                status: 'Client is already registered.'
            });

            return;
        }

        console.log('registering new service : ' + querySTR.phone);

        this.AppContext.QRBucket[USER_ID] = null;
        var SESSION_DIR = process.env.SESSION_DIR;
        var SESSION_FILE_PATH = SESSION_DIR + '/botsession-' + USER_ID + '.json';

        if (!fs.existsSync(SESSION_DIR)) {
            fs.mkdirSync(SESSION_DIR);
        }

        var sessionCfg;
        if (fs.existsSync(SESSION_FILE_PATH)) {
            console.log('loading session from storage : ' + querySTR.phone);
            fs.readFile(SESSION_FILE_PATH, 'utf8', function (err, data) {
                if (err) {
                    return console.log(err);
                }

                sessionCfg = JSON.parse(data);
                console.log(sessionCfg);
            });
        }

        this.ConnectionMananger.AddClient(USER_ID, new Client({ puppeteer: { headless: true, args: ['--no-sandbox'] }, session: sessionCfg }));
        this.ConnectionMananger.GetClient(USER_ID).on('disconnected', (reason) => {
            if (fs.existsSync(SESSION_FILE_PATH)) {
                // remove current session file
                fs.unlinkSync(SESSION_FILE_PATH);
                sessionCfg = null;
            }

            //destroy client instance
            this.ConnectionMananger.GetClient(USER_ID).destroy().then(function () {
                console.log('Client is shutdown..');
                this.ConnectionMananger.RemoveClient(USER_ID);
            });
        });

        this.ConnectionMananger.GetClient(USER_ID).on('authenticated', (session) => {
            console.log('login sucess..');
            console.log(session.WAToken1);

            sessionCfg = session;
            fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
                if (err) {
                    console.error(err);
                }
            });
        });

        this.ConnectionMananger.GetClient(USER_ID).on('auth_failure', msg => {
            // Fired if session restore was unsuccessfull
            console.error('AUTHENTICATION FAILURE', msg);

            // remove current session file
            fs.unlinkSync(SESSION_FILE_PATH);
            sessionCfg = null;

            //destroy client instant 
            this.ConnectionMananger.GetClient(USER_ID).destroy().then(function () {
                console.log('Client is shutdown..');

                // delete from connected list
                this.ConnectionMananger.RemoveClient(USER_ID);
            });
        });

        this.ConnectionMananger.GetClient(USER_ID).on('qr', (qr) => {
            // Generate and scan this code with your phone
            this.AppContext.QRBucket[USER_ID] = qr;
            console.log("qrcode is ready..");
        });

        this.ConnectionMananger.GetClient(USER_ID).on('ready', () => {
            this.ConnectionMananger.AddClientReady(USER_ID);
            console.log('Client is ready..');
        });

        var mConnectionMananger = this.ConnectionMananger;
        mConnectionMananger.GetClient(USER_ID).on('message', async msg => {
            console.log(this.util.format("incoming message from %s : %s", msg.from, msg.body));
            if (msg.body.toLocaleLowerCase() == 'ping') {
                const chat = await msg.getChat();
                chat.sendStateTyping();
                mConnectionMananger.GetClient(USER_ID).sendMessage(msg.from, 'pong!!!');
                mConnectionMananger.GetClient(USER_ID).sendMessage(msg.from, 'Wanna some inspiring quote?');
                mConnectionMananger.GetClient(USER_ID).sendMessage(msg.from, 'Text me "*inspire*"!');
                chat.clearState();
            }

            if (msg.body.toLocaleLowerCase() == 'inspire') {
                var inspiringQuotes = [
                    'When there is no desire, all things are at peace. - Laozi',
                    'Simplicity is the ultimate sophistication. - Leonardo da Vinci',
                    'Simplicity is the essence of happiness. - Cedric Bledsoe',
                    'Smile, breathe, and go slowly. - Thich Nhat Hanh',
                    'Simplicity is an acquired taste. - Katharine Gerould',
                    'Well begun is half done. - Aristotle',
                    'He who is contented is rich. - Laozi',
                    'Very little is needed to make a happy life. - Marcus Antoninus',
                    'It is quality rather than quantity that matters. - Lucius Annaeus Seneca',
                    'Genius is one percent inspiration and ninety-nine percent perspiration. - Thomas Edison',
                    'Computer science is no more about computers than astronomy is about telescopes. - Edsger Dijkstra',
                    'It always seems impossible until it is done. - Nelson Mandela',
                    'Act only according to that maxim whereby you can, at the same time, will that it should become a universal law. - Immanuel Kant',
                ];
                var item = inspiringQuotes[Math.floor(Math.random() * inspiringQuotes.length)];

                const chat = await msg.getChat();
                chat.sendStateTyping();
                mConnectionMananger.GetClient(USER_ID).sendMessage(msg.from, item);
                chat.clearState();
            }
        });

        //start whatsapp client engine 
        console.log('initializing');
        res.setHeader('Content-Type', 'Application/Json');
        res.send({
            info: true,
            status: "Server is Up, Ready for Scan QR!"
        });

        try {
            await this.ConnectionMananger.GetClient(USER_ID).initialize();
        } catch (error) {
            console.log(error);
            console.log("Deleting Client from the list");
            this.ConnectionMananger.RemoveClient(USER_ID);
        }
    }
}