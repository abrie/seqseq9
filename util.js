"use strict";

function randInt(v) {
    return Math.floor( Math.random()*v );
}

function randIndex(arr) {
    return arr[randInt(arr.length)];
}

module.exports = {
    randInt:randInt,
    randIndex:randIndex,
};
