﻿declare function require(name: string);
import * as Common from '../VantageLib/Common';
import { EventEmitter } from 'events';
const io = require('socket.io-client');

export default class ClientSocket {
    config: any;
    socket: any;
    eventEmitter: any;
    client: string;

    public constructor(client:string = 'wsclient') {
        this.config = require('./VantageJS.json');
        this.client = client;
        this.eventEmitter = new EventEmitter();    
    }

    start() {                 
        this.getSocket();        
    }

    startAsync() {
        return new Promise((resolve,reject) => {
            this.getSocket(
                () => resolve(),
                err => reject(err));
        });
    }

    
    getSocket(connectCB=null,errorCB=null) {       
        this.socket = io(this.config.socketUrl, { query: { client: this.client } });
        console.log('socket url:' + this.config.socketUrl); 

        this.socket.on('connect', () => {
            console.log('ClientSocket connected');
            connectCB && connectCB(0);
            this.socket.on('current', current => {
                this.emitEvent('current',current);
            });

            this.socket.on('hilows', hilows => {
                this.emitEvent('hilows', hilows);
            });

            this.socket.on('vp1_current', current => {               
                this.emitEvent('vp1_current', JSON.parse(current));
            });

            this.socket.on('alerts', (data) => {
                if (data && data.length) {
                    var alerts = data[0];
                    this.emitEvent('alerts', alerts);
                }
            });        
        });  

        this.socket.on('error', error => {
            errorCB && errorCB(error);
        });
    }
    
    emitEvent(name: string, obj: any) {
        try {
            this.eventEmitter.emit(name, obj);
        }
        catch (e) {
            Common.Logger.error(e);
        }
    }

    socketEmit(name: string, obj: any) {
        try {           
            this.socket.emit(name, JSON.stringify(obj));
        }
        catch (e) {
            Common.Logger.error('ClientSocket.emit' + e);
        }
    }

    subscribeCurrent(listener: any) {
        try {
            this.eventEmitter.on('current', listener);
        }
        catch (e) {
            Common.Logger.error(e);
        }
    }

    subscribeHiLow(listener: any) {
        try {
            this.eventEmitter.on('hilows', listener);
        }
        catch (e) {
            Common.Logger.error(e);
        }
    }

    subscribeAlert(listener: any) {
        try {
            this.eventEmitter.on('alert', listener);
        }
        catch (e) {
            Common.Logger.error(e);
        }
    }

    subscribeHistory(listener: any) {
        try {
            this.eventEmitter.on('history', listener);
        }
        catch (e) {
            Common.Logger.error(e);
        }
    }

    subscribe(eventName: string, listener: any ) {
        try {
            this.eventEmitter.on(eventName, listener);
        }
        catch (e) {
            Common.Logger.error(e);
        }
    }
}