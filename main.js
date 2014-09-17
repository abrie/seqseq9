"use strict";
var Queue = require('./queue.js');
var midi = require('./midi.js');
var util = require('./util.js');
var bjorklund = require('./bjorklund.js');

var PPQN = 24;

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


function Emitter(patterns) {
    var shifts = [0,7,-4,12];
    function emit(desc, note, velocity) {
        var shift = util.randIndex(shifts);
        var pattern = desc.pattern[desc.patternIndex++%desc.pattern.length];
        var os = util.randInt(3); // random offset to start
        var velFade = Math.ceil( velocity / pattern.length );
        pattern.forEach( function(isPulse, step) {
            var v = velocity - step*velFade;
            if( desc.shiftAlways ) {
                shift = util.randIndex(shifts);
            }
            if( isPulse ) {
                var onMessage = midi.noteOn(desc.channel, note+shift, v);
                queue.enqueue((step+os)*desc.stepSize, onMessage );
                var offMessage = midi.noteOff(desc.channel, note+shift, v);
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
        {   channel: 0,
            patternIndex: 0,
            pattern: [bjorklund(4,3)],
            stepSize: PPQN/4, 
            shiftAlways: false,
        },
    ],
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



