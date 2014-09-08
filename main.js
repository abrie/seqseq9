var midi = require('midi');
var input = new midi.input();
var output = new midi.output();
var INPUT = 0;
var OUTPUT = 1;
console.log("\n*synth IX* manandjazz");
console.log("Input port:", input.getPortName(INPUT));
console.log("Output port:", output.getPortName(OUTPUT));
output.openPort(OUTPUT);
input.openPort(INPUT);
input.ignoreTypes(true,false,true);

NOTE_ON = 0x90;
NOTE_OFF = 0x80;
SYSTEM = 0xF0;
CLOCK = 0x08;
START = 0x0A;
CONTINUE = 0x0B;
STOP = 0x0C;
RESET = 0x0F;
PPQN = 24;

function getHiStatus(message) {
    return message[0] & 0xF0;
}

function getLoStatus(message) {
    return message[0] & 0x0F;
}


function R() {
    return Math.floor(Math.random()*3);
}

var r = R(); 
function onNoteOn(channel, note, velocity) {
    if( channel === 0 ) {
        noteOn(0, note, 127);
        noteOn(1, note, 127);
        noteOn(2, note, 127);
    }
}

function onNoteOff(channel, note, velocity) {
    if( channel === 0 ) {
    }
}

function rand(v) {
    return Math.floor( Math.random()*v );
}

var set = [rand(4)*PPQN,rand(7)*PPQN,rand(10)*PPQN];
var setIndex = 0;
function noteOn(channel, note, velocity) {
    var offset = set[setIndex++ % set.length];
    addMessage(offset, [NOTE_ON + channel, note, velocity]);
    addMessage(offset+PPQN/4, [NOTE_ON + channel, note+12, velocity]);

    addMessage(offset+PPQN, [NOTE_OFF + channel, note, velocity]);
    addMessage(offset+PPQN/4+PPQN/2, [NOTE_OFF + channel, note+12, velocity]);
}

var eventQueue = [];
function addMessage(offset, message) {
    if( eventQueue.length <= offset ) {
        var newArray = [];
        newArray[ offset - eventQueue.length ] = [];
        eventQueue = eventQueue.concat( newArray );
    }
    if( eventQueue[offset] === undefined ) {
        eventQueue[offset] = [];
    }
    eventQueue[offset].push(message);
}

function readMessage() {
    var messages = eventQueue.shift();
    if( messages ) {
        messages.forEach( function(message) {
            output.sendMessage(message);
        });
    }
}

var pulses = 0;
var position = {};
function onPulse() {
    readMessage();
}

input.on('message', function(deltaTime, message) {
    switch( getHiStatus(message) ) {
        case NOTE_ON:
            onNoteOn(
                getLoStatus(message),
                message[1],
                message[2]);
        break;
        case NOTE_OFF:
            onNoteOff(
                getLoStatus(message),
                message[1],
                message[2]);
        break;
        case SYSTEM:
            switch( getLoStatus(message) ) {
                case CLOCK:
                    onPulse();
                break; 
                case START:
                    console.log("<clock START>");
                break;
                case STOP:
                    console.log("<clock STOP>");
                    pulses = 0;
                break;
                case CONTINUE:
                    console.log("<clock CONTINUE>");
                break;
            }
        break;

    }
});
