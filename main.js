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

function rand(v) {
    return Math.floor( Math.random()*v );
}

function Emitter(patterns) {
    var shifts = [0,7,3,12];
    function emit(desc, note, velocity) {
        desc.pattern.forEach( function(isPulse, step) {
            var shift = shifts[rand(shifts.length)];
            var vshift = Math.min(127, velocity+(rand(15)-5));
            vshift = Math.max( vshift, 0 );
            if( isPulse ) {
                var onMessage = midi.noteOn(desc.channel, note+shift, vshift);
                queue.enqueue(step*desc.stepSize, onMessage );
                var offMessage = midi.noteOff(desc.channel, note+shift, vshift);
                queue.enqueue((step+1)*desc.stepSize, offMessage );
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
        { channel: 1, pattern: bjorklund(5,3), stepSize: PPQN/4 },
    ],
    1:[
        { channel: 0, pattern: bjorklund(12,7), stepSize: PPQN/4 },
        { channel: 2, pattern: bjorklund(24,13,true), stepSize: PPQN },
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



