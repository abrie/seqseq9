var Queue = require('./queue.js');
var midi = require('./midi.js');
var bjorklund = require('./bjorklund.js');

PPQN = 24;

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

function randNumber(v) {
    return Math.floor( Math.random()*v );
}

function randIndex(arr) {
    return arr[randNumber(arr.length)];
}

function Emitter(patterns) {
    var shifts = [0,7,3, 12];
    function emit(desc, note, velocity) {
        var shift = randIndex(shifts);
        var vshift = Math.min(127, velocity+(randNumber(25)-12));
        vshift = Math.max( vshift, 0 );
        var pattern = desc.pattern[desc.patternIndex++%desc.pattern.length];
        var os = randNumber(3); // random offset to start
        pattern.forEach( function(isPulse, step) {
            if( desc.shiftAlways ) {
                shift = randIndex(shifts);
            }
            if( isPulse ) {
                var onMessage = midi.noteOn(desc.channel, note+shift, vshift);
                queue.enqueue((step+os)*desc.stepSize, onMessage );
                var offMessage = midi.noteOff(desc.channel, note+shift, vshift);
                queue.enqueue((step+os+1)*desc.stepSize, offMessage );
            }
        });
    }

    function on(channel, note, velocity) {
        var streams = patterns[channel];
        if( streams ) {
            streams.forEach( function(stream) { 
                emit(stream, note, velocity); 
            }); 
        }
    }

    function setStepSize(channel, value) {
        var stream = patterns[channel];
        stream.forEach( function(stream) {
            stream.stepSize = Math.ceil(PPQN/value);
            console.log("stepSize set:", stream.stepSize);
        });
    }


    return {
        on: on,
        setStepSize: setStepSize
    };
}

var emitterA = new Emitter({
    0:[
        {   channel: 1,
            patternIndex: 0,
            pattern: [bjorklund(13,7), bjorklund(8,6)],
            stepSize: PPQN/4,
            shiftAlways: true,
        },
    ],
    1:[
        {   channel: 0,
            patternIndex: 0,
            pattern: [bjorklund(24,7,true)],
            stepSize: PPQN/4, 
            shiftAlways: false,
        },
        {   channel: 2,
            patternIndex: 0,
            pattern: [bjorklund(24,7,true)],
            stepSize: PPQN/4, 
            shiftAlways: false,
        },
    ]
});

var pulses = 0;
var queue = new Queue();
function onPulse() {
    queue.dequeue().forEach( midi.sendMessage );
}

midi.setMessageHandlers({
    onNoteOn:onNoteOn,
    onNoteOff:onNoteOff,
    onCC:onCC,
    onPulse:onPulse,
    onStart: function() {},
    onStop: function() {},
    onContinue: function() {},
    onSPP: function() {}});



