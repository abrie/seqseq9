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
CC = 0xB0;
SYSTEM = 0xF0;
SPP = 0x02;
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
    emitterA.on(channel, note, velocity);
}

function onCC(channel, controller, value) {
    if( controller === 9 ) {
        emitterA.setStepSize(channel, value);
    }
}

function onNoteOff(channel, note, velocity) {
    if( channel === 0 ) {
    }
}

function rand(v) {
    return Math.floor( Math.random()*v );
}

function Emitter(patterns) {
    var shifts = [0,3,7,1];
    function emit(desc, note, velocity) {
        desc.pattern.forEach( function(isPulse, step) {
        var shift = shifts[rand(shifts.length)];
            if( isPulse ) {
                var onMessage = [NOTE_ON + desc.channel, note+shift, velocity];
                messageQueue.enqueue(step*desc.stepSize, onMessage );
                var offMessage = [NOTE_OFF + desc.channel, note+shift, velocity];
                messageQueue.enqueue((step+desc.stepsPerNote)*desc.stepSize, offMessage );
            }
        });
    }

    function on(channel, note, velocity) {
        var streams = patterns[channel];
        streams.forEach( function(stream) { 
            emit(stream, note, velocity); 
        }); 
    }

    function setStepSize(channel, value) {
        var stream = patterns[channel];
        stream.forEach( function(stream) {
            stream.stepSize = PPQN/value;
        });
        console.log("stepSize set:", channel, value);
    }


    return {
        on: on,
        setStepSize: setStepSize
    };
}

var emitterA = new Emitter({
    0:[
        { channel: 0, pattern: generateBjorklund(5,3), stepsPerNote: 1, stepSize: PPQN/4 },
    ],
    1:[
        { channel: 1, pattern: generateBjorklund(5,3,true), stepsPerNote: 1, stepSize: PPQN/4 },
    ]
});

var MessageQueue = function() {
    var eventQueue = [];
    function enqueue(offset, message) {
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

    function dequeue( callback ) {
        var messages = eventQueue.shift();
        if( messages ) {
            messages.forEach( function(message) {
                callback(message);
            });
        }
    }

    return {
        enqueue: enqueue,
        dequeue: dequeue
    };
};


var pulses = 0;
var position = {};
var messageQueue = new MessageQueue();
function onPulse() {
    function sendMessage(message) {
        output.sendMessage(message);
    }
    messageQueue.dequeue( sendMessage );
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
        case CC:
            onCC(
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
                    pulses = 0;
                break;
                case STOP:
                    console.log("<clock STOP>");
                break;
                case CONTINUE:
                    console.log("<clock CONTINUE>");
                break;
                case SPP:
                    console.log("<pointer>", message[1], message[2]);
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

function generateBjorklund( steps, pulses, pulseFirst ) {
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

    if(pulseFirst) {
        var first = pattern.indexOf( 1 );
        var slice = pattern.slice(0, first);
        pattern.splice(0,first);
        pattern = pattern.concat(slice);
    }

    return pattern;
}
