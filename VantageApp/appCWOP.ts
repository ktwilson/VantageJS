﻿import CWOP from '../VantageLib/CWOP';
import ClientSocket from '../VantageLib/ClientSocket';
import VPCurrent from '../VantageLib/VPCurrent';
import * as Common from '../VantageLib/Common';
const moment = require('moment');

Common.Logger.init('cwop.log');
Common.Logger.info('started'); 

const socket = new ClientSocket();
const cwop = new CWOP(socket); 
let current: VPCurrent;

let begin = async () => {
    await cwop.queryEngine.connectDB(); 
    await socket.startAsync();   

    await cwop.updateFromArchive();

    socket.subscribeCurrent((vpcur) => {
        current = vpcur;
    });

    socket.subscribeHiLow(async (hilows) => {
        try {          
            await cwop.updateFromArchive();

            if (current) {
                let rain = await cwop.queryEngine.getRainTotals(moment());
                hilows.rain24hour = rain.last24;
                hilows.rain1hour = rain.hourly;
                cwop.update(current, hilows).catch(err => socket.socketEmit('error', 'cwop:' + err));
            }
        }
        catch (err) {
            Common.Logger.error(err);
            socket.socketEmit('error', 'cwop:' + err);
        }
    });    
};

begin();

 
 