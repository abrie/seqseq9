var midi = require('midi');
var input = new midi.input();
var output = new midi.output();
console.log(input.getPortName(0));
input.ignoreTypes(true,false,true);

NOTE_ON = 0x90;
NOTE_OFF = 0x80;
SYSTEM = 0xF0;
CLOCK = 0x08;
START = 0x0A;
CONTINUE = 0x0B;
STOP = 0x0C;
RESET = 0x0F;

function getHiStatus(message) {
    return message[0] & 0xF0;
}

function getLoStatus(message) {
    return message[0] & 0x0F;
}

output.openPort(0);

input.openPort(0);
input.on('message', function(deltaTime, message) {
    switch( getHiStatus(message) ) {
        case NOTE_ON:
            console.log("note on", getLoStatus(message));
        break;
        case NOTE_OFF:
            console.log("note off", getLoStatus(message));
        break;
        case SYSTEM:
            switch( getLoStatus(message) ) {
                case CLOCK:
                    console.log("<clock tick>");
                break; 
                case START:
                    console.log("<clock start>");
                break;
                case STOP:
                    console.log("<clock stop>");
                break;
                case CONTINUE:
                    console.log("<clock continue>");
                break;
            }
        break;

    }
});
