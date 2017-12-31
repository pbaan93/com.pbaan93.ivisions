'use strict';

const Homey = require('homey');
const RFDriver = require('homey-rfdriver');
const util = RFDriver.util;

module.exports = RFDevice => class ProjectorLift extends RFDevice {

    static payloadToData(payload) {
        console.log('payloadToData');

        //crc calculations
        let crcCalculated = 0;
        for(let i = 1; i <= 6; i++)
        {
            crcCalculated += parseInt(util.bitArrayToString(payload.slice(i*8, i*8+8)), 2 );
        }
        crcCalculated = crcCalculated%256;
        //console.log("crcCalculated", crcCalculated);
        let crcPayload = parseInt(util.bitArrayToString(payload.slice(56, 64)), 2 );
        //console.log("crcPayload", crcPayload);

        //payload integrity checks
        if((util.bitArrayToString(payload.slice(0, 8))==='10100011')&&(util.bitArrayToString(payload.slice(40, 48))==='00000000')&&(crcCalculated===crcPayload))
        {
            const data = {
                address: util.bitArrayToString(payload.slice(8, 32)),
                channel: util.bitArrayToString(payload.slice(32, 40))
            };

            let cmd = util.bitArrayToString(payload.slice(48, 56));
            if(cmd==='00001011'){
                data.windowcoverings_state = "up";
                data.id = `${data.address}`;
                return data;
            }
            else if(cmd==='00100011'){
                data.windowcoverings_state = "idle";
                data.id = `${data.address}`;
                return data;
            }
            else if(cmd==='01000011'){
                data.windowcoverings_state = "down";
                data.id = `${data.address}`;
                return data;
            }
            else{
                return null;
            }
        }
        return null;
    }
    
    static dataToPayload(data) {
        console.log('dataToPayload');
        //console.log('DATA', data);

        if (data) {

            let command;
            if (data.windowcoverings_state=='up') {
                command = '00001011';
            }
            else if(data.windowcoverings_state=='idle'){
                command = '00100011';
            }
            else if(data.windowcoverings_state=='down'){
                command = '01000011';
            }
            else
            {
                return null;
            }

            const address = util.bitStringToBitArray(data.address);
            const channel = util.bitStringToBitArray(data.channel);

            //crc calculations
            var crc = parseInt(data.address.substring(0, 8), 2);
            crc += parseInt(data.address.substring(8, 16), 2);
            crc += parseInt(data.address.substring(16, 24), 2);
            crc += parseInt(data.channel, 2);
            crc += parseInt('00000000', 2);
            crc += parseInt(command, 2);
            crc = crc%256;
            //console.log("crc", crc);
            var crcBin = crc.toString(2)
            //if first bits are 0
            while(crcBin.length < 8)
            {
                crcBin = "0" + crcBin;
            }
            //console.log("crcBin", crcBin);
            
            //make payload
            return util.bitStringToBitArray('10100011').concat(address, channel,util.bitStringToBitArray('00000000'), util.bitStringToBitArray(command), util.bitStringToBitArray(crcBin));

        }
        return null;
    }
};