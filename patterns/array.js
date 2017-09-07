// Require Str primitive from sealang !
const { Arr } = require('sealang');

/*
 * @class Int
 */
class Array {

    /*
     * @static Int.isMatching 
     * @param {String} str
     */
    static isMatching(str) {
        if('string' !== typeof(str)) {
            throw new TypeError('Invalid type for str argument!');
        }
        return Array.pattern.test(str);
    }

}

Array.element = Arr;
Array.pattern = new RegExp(/^\s*\t*Array<(Int|String|Boolean|Scalar)>\s([a-zA-Z]+[0-9]*)\s/);

// Export Int
module.exports = Array;