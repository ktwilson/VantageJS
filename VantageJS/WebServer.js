"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require('http');
const moment = require('moment');
const url = require('url');
const Common = require("./Common");
const ClientSocket_1 = require("./ClientSocket");
class WebServer {
    constructor(config, ws) {
        this.config = config;
        this.ws = ws;
    }
    start() {
        this.server = http.createServer((req, res) => { this.requestReceived(req, res); });
        this.io = require('socket.io-client');
        this.server.listen(this.config.webPort);
        Common.Logger.info('web server listening ' + this.config.webPort);
        this.clientSocket = new ClientSocket_1.default(this.config, 'vantagejs');
        this.clientSocket.start();
        this.ws.subscribeCurrent(current => {
            this.emit('current', current);
        });
        this.ws.subscribeHiLow(hilows => {
            this.emit('hilows', hilows);
        });
        this.ws.subscribeAlert(alerts => {
            this.emit('alerts', alerts);
        });
        this.clientSocket.subscribe('vp1_current', current => {
            var vp1Current = JSON.parse(current);
            vp1Current.dateLoaded = new Date(vp1Current.dateLoaded);
            this.ws.vp1Current = vp1Current;
        });
        this.clientSocket.subscribe('vp1_hilows', hilows => {
            this.ws.vp1Hilows = hilows;
        });
    }
    requestReceived(req, res) {
        Common.Logger.info('WebRequest ' + moment().format('hh:mm:ss'));
        var allowOrigins = this.config.allowOrigins[0];
        var origin = req.headers.origin;
        console.log('origin:' + origin);
        var allowOrigin = this.config.allowOrigins.filter(o => {
            if (o.includes(origin))
                return true;
            else
                return false;
        });
        if (allowOrigin.length)
            allowOrigins = allowOrigin[0];
        Common.Logger.info(allowOrigins);
        try {
            if (req.url == '/hilows') {
                if (this.ws.hilows) {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigins });
                    res.end(JSON.stringify(this.ws.hilows));
                }
                else {
                    res.writeHead(200);
                    res.end("no data");
                }
            }
            if (req.url == '/forecast') {
                if (this.ws.hilows) {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigins });
                    res.end(JSON.stringify(this.ws.forecast));
                }
                else {
                    res.writeHead(200);
                    res.end("no data");
                }
            }
            if (req.url == '/gettime') {
                res.writeHead(200);
            }
            if (req.url.indexOf('/archives') > -1) {
                var args = req.url.split(/[&,?,=]+/);
                var startDt = null;
                var period = null;
                var ctype = 'application/json';
                if (args.length > 1)
                    startDt = decodeURI(args[2]);
                if (args.length > 2 && args[3] == 'period')
                    period = args[4];
                if (args.includes('csv'))
                    ctype = 'text/csv';
                if (!period) {
                    this.ws.queryEngine.getArchivesDB(startDt, 'months').then((archives) => {
                        res.writeHead(200, { 'Content-Type': ctype, 'Access-Control-Allow-Origin': allowOrigins });
                        //var temps = this.ws.queryEngine.archiveGroupBy(archives, 'archiveDate', 'outTemp');
                        //var results = []
                        //temps.forEach(t => {
                        //    results.push((t));
                        //})
                        if (ctype == 'application/json') {
                            res.end(JSON.stringify(archives));
                        }
                        else {
                            var data = this.getCsv(archives);
                            data.forEach(d => {
                                res.write(d);
                            });
                            res.end();
                        }
                    });
                }
                else {
                    this.ws.queryEngine.getArchivesSum(startDt, period).then(archives => {
                        res.writeHead(200, { 'Content-Type': ctype, 'Access-Control-Allow-Origin': allowOrigins });
                        if (ctype == 'application/json') {
                            res.end(JSON.stringify(archives));
                        }
                        else {
                            var data = this.getCsv(archives);
                            data.forEach(d => {
                                res.write(d);
                            });
                            res.end();
                        }
                    });
                }
            }
            else if (req.url.indexOf('archiveint') > -1) {
                var interval = req.url.split('=');
                if (interval.length) {
                    interval = interval[1];
                    this.ws.sendCommand('SETPER ' + interval, result => {
                        res.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': allowOrigins });
                        res.end(result);
                    });
                }
            }
            else if (req.url == '/schedule') {
                var urlp = url.parse(req.url);
                var parm = urlp.query.split('=');
                var result = '';
                if (parm.length == 2) {
                }
            }
            else {
                if (this.ws.current) {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigins });
                    res.end(JSON.stringify(this.ws.current));
                }
                else {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowOrigins });
                    res.end("no data");
                }
            }
        }
        catch (e) {
            Common.Logger.error('RequestReceived:' + e);
        }
    }
    getCsv(archives) {
        var data = [];
        var headers = [];
        archives.forEach(arch => {
            var drow = '';
            if (!headers.length) {
                Object.keys(arch).forEach(col => {
                    headers.push(col);
                    drow += col + '\t';
                });
            }
            else {
                Object.keys(arch).forEach(col => {
                    if (typeof arch[col] == 'object')
                        arch[col] = JSON.stringify(arch[col]);
                    drow += arch[col] + '\t';
                });
            }
            data.push(drow + '\n');
        });
        return data;
    }
    //webSocket() {
    //    this.io.on('connection', (socket) => {
    //        try {
    //            Common.Logger.info('socket connection from:' + socket.request.connection.remoteAddress)
    //            //Common.Logger.info(socket.request.headers);
    //            if (this.ws.current)
    //                socket.emit('current', JSON.stringify(this.ws.current));
    //            if (this.ws.hilows)
    //                socket.emit('hilows', JSON.stringify(this.ws.hilows));
    //            if (this.ws.alerts)
    //                socket.emit('alerts', JSON.stringify(this.ws.alerts));
    //            socket.on('hilows', (data) => {
    //                Common.Logger.info('hilows req');
    //                socket.emit('hilows', JSON.stringify(this.ws.hilows));
    //            });
    //            socket.on('message',
    //                (msgtype, msg) => {
    //                    this.io.sockets.emit('message', msg);
    //                });
    //        }
    //        catch (e) {
    //            Common.Logger.error('webSocket:' + e);
    //        }
    //    });
    //}
    emit(name, obj) {
        try {
            this.clientSocket.socketEmit(name, obj);
        }
        catch (e) {
            Common.Logger.error('WebServer.emit' + e);
        }
    }
}
exports.default = WebServer;
//# sourceMappingURL=WebServer.js.map