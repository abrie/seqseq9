
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

    function dequeue() {
        var result = eventQueue.shift();
        return result ? result : [];
    }

    return {
        enqueue: enqueue,
        dequeue: dequeue
    };
};

module.exports = MessageQueue;
