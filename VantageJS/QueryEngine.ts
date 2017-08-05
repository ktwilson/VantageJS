﻿declare function require(name: string);
var moment = require('moment');
import MongoDB from './MongoDB';
import * as Common from './Common';

export default class QueryEngine {
    config: any;   
    mongo: MongoDB;
    connected: boolean;

    constructor(config, mongo:any) {
        this.config = config;      
        if (mongo != null)
            this.mongo = mongo;
        else {
            this.mongo = new MongoDB(config);
            this.connect();
        }
            
    }

    connect() {
        var promise = new Promise((resolve, reject) => {
            if (!this.connected) {
                this.mongo.connect().then(() => {
                    this.connected = true;
                });
            }
            else {
                resolve();
            }
        });

        return promise;
    }

    getRain() {        
        var yday = moment().add(-1, 'days').unix();
        console.log(moment.unix(yday));
        var hourAgo = moment().add(-1, 'hour').unix();
        var tot24rain: number = 0;
        var hourlyrain: number = 0;      

        var promise = new Promise((resolve, reject) => {
            this.connect().then(() => {
                this.mongo.sum('archive', 'rainClicks', { _id: { $gte: yday } }, (err, res) => {
                    if (!err) {
                        tot24rain = res[0].total;
                    }
                    else {
                        Common.Logger.error(err);
                        reject();
                    }

                    this.mongo.sum('archive', 'rainClicks', { _id: { $gte: hourAgo } }, (err, hrly) => {
                        if (!err) {
                            hourlyrain = hrly[0].total;
                            resolve({ last24: tot24rain, hourly: hourlyrain });
                        }
                        else {
                            Common.Logger.error(err);
                            reject();
                        }
                    });

                });
            }, err => {
                Common.Logger.error(err);
            });
            
        });

        return promise;
    }
}