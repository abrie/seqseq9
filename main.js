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

var channels = [
    generateBjorklund(8,3,true),
    generateBjorklund(13,4),
    generateBjorklund(24,21,true)
];

function noteOn(channel, note, velocity) {
    channels[channel].forEach( function(isPulse, index) {
        if( isPulse ) {
            addMessage(index*PPQN/2, [NOTE_ON + channel, note, velocity]);
            addMessage((index+2)*PPQN/2, [NOTE_OFF + channel, note, velocity]);
        }
    });
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

function generateBjorklund( steps, pulses, noRotate ) {
    var divisor = steps - pulses;
    var level = 0;

    if( pulses === 0) {
        var result = [];
        for( var index = 0; index < steps; index++ ) {
            result.push(0);
        }
        return result;
    }

    var pattern = [];
    var counts = [];
    var remainders = [];

    remainders.push( pulses );

    while( true ) {
        var count = Math.floor( divisor / remainders[level] );
        counts.push( count );
        var remainder = divisor % remainders[level];
        remainders.push( remainder );
        divisor = remainders[level];
        level = level + 1;
        if( remainders[level] <= 1 ) {
            break;
        }
    }

    counts.push(divisor);

    function build( l ) {
        if( l === -1 ) {
            pattern.push( 0 );
            return;
        }
        if( l === -2 ) {
            pattern.push( 1 );
            return;
        }

        for( var i = 0; i < counts[l]; i++ ) {
            build( l - 1 );
        }

        if( remainders[l] !== 0 ) {
            build( l - 2 );
        }
    }

    build( level );

    if(noRotate) {
        return pattern;
    }
    else { //rotate so first element is a pulse
        var first = pattern.indexOf( 1 );
        var slice = pattern.slice(0, first);
        pattern.splice(0,first);
        return pattern.concat(slice);
    }
}
