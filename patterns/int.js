const pattern = require('./patternAbstract.js');

// Require Str primitive from sealang !
const { Int: SEAInt } = require('sealang');

/*
 * @class Int
 */
class Int extends pattern {

    /*
     * @static Int.isMatching 
     * @param {String} str
     */
    static isMatching(str) {
        if('string' !== typeof(str)) {
            throw new TypeError('Invalid type for str argument!');
        }
        return Int.pattern.test(str);
    }

}

Int.element = SEAInt;
Int.pattern = new RegExp(/^\s*\t*Int\s+([a-zA-Z]+[0-9]*)\s+=\s+([0-9]+)/);

// Export Int
module.exports = Int;