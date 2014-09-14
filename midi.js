var midi = require('midi');
var input = new midi.input();
var output = new midi.output();
var INPUT = 0;
var OUTPUT = 1;
var NOTE_ON = 0x90;
var NOTE_OFF = 0x80;
var CC = 0xB0;
var SYSTEM = 0xF0;
var SPP = 0x02;
var CLOCK = 0x08;
var START = 0x0A;
var CONTINUE = 0x0B;
var STOP = 0x0C;
var RESET = 0x0F;

function getHiStatus(message) {
    return message[0] & 0xF0;
}

function getLoStatus(message) {
    return message[0] & 0x0F;
}

console.log("\n*synth IX* manandjazz");
console.log("Input port:", input.getPortName(INPUT));
console.log("Output port:", output.getPortName(OUTPUT));

output.openPort(OUTPUT);
input.openPort(INPUT);
input.ignoreTypes(true,false,true);

function sendMessage(message) {
    output.sendMessage(message);
}

var handlers = {};
function setMessageHandlers(dict) {
    handlers = dict;
}

input.on('message', function(deltaTime, message) {
    switch( getHiStatus(message) ) {
        case NOTE_ON:
            handlers.onNoteOn(
                getLoStatus(message),
                message[1],
                message[2]);
        break;
        case NOTE_OFF:
            handlers.onNoteOff(
                getLoStatus(message),
                message[1],
                message[2]);
        break;
        case CC:
            handlers.onCC(
                getLoStatus(message),
                message[1],
                message[2]);
        break;
        case SYSTEM:
            switch( getLoStatus(message) ) {
                case CLOCK:
                    handlers.onPulse();
                break; 
                case START:
                    handlers.onStart();
                break;
                case STOP:
                    handlers.onStop();
                break;
                case CONTINUE:
                    handlers.onContinue();
                break;
                case SPP:
                    handlers.onSPP(message[1], message[2]);
                break;
                default:
                    console.log("unknown system:", message);
                break;
            }
        break;
        default:
            console.log("unknown status:", message);
        break;

    }
});

function noteOn( channel, note, velocity ) {
    return [NOTE_ON + channel, note, velocity];
}

function noteOff( channel, note, velocity ) {
    return [NOTE_OFF + channel, note, velocity];
}

module.exports = {
    setMessageHandlers:setMessageHandlers,
    sendMessage:sendMessage,
    noteOn: noteOn,
    noteOff: noteOff,
};
