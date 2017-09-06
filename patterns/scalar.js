const pattern = require('./patternAbstract.js');

// Require Str primitive from sealang !
const { Scalar: SEAScalar } = require('sealang');

/*
 * @class Scalar
 */
class Scalar extends pattern {

    /*
     * @static String.isMatching 
     * @param {String} str
     */
    static isMatching(str) {
        if('string' !== typeof(str)) {
            throw new TypeError('Invalid type for str argument!');
        }
        return Scalar.pattern.test(str);
    }

}

Scalar.element = SEAScalar;
Scalar.pattern = new RegExp(/^\s*\t*Scalar\s+([a-zA-Z]+[0-9]*)\s+=\s+(.*)/);;

// Export String
module.exports = Scalar;