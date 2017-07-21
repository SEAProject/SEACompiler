// Node core module!
const events        = require('events');
const { readFile }  = require('fs');
const { promisify } = require('util');
const { extname }   = require('path');

// SEA Lang schema API
const sea = require('../schema/core.js');

// Async Node core method!
const readFileAsynchronous = promisify(readFile);

/*
 * Compiler main class!
 */
class Compiler extends events {

    constructor(source) {
        super();
        if("undefined" === typeof(source)) {
            throw new Error('Please defined a source destination!');
        }
        this.source = source;
    }

    async transpile() {
        try {
            const buf = await readFileAsynchronous(this.source);
            var strUTF = buf.toString();
        }
        catch(E) {
            console.error(E);
        }
        
        const lines = strUTF.split('\n');
        lines.forEach( (v,i) => {
            console.log('Line '+i);
            console.log(v);
            console.log('---------');
        })
    }

}

// Export compiler;
module.exports = {
    Compiler
};