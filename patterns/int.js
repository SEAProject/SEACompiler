const pattern = require('./patternAbstract.js');

// Require Str primitive from sealang !
const { Int: SEAInt } = require('sealang');

// String pattern to match!
const IntPattern = new RegExp(/^\s*\t*Int\s+([a-zA-Z]+[0-9]*)\s+=\s+([0-9]+)/);

/*
 * @class Int
 * @property {String} name
 * @property {Number} value
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
        return IntPattern.test(str);
    }

    /*
     * @constructor 
     * @param {String} str
     */
    constructor(str) {
        super();
        if('string' !== typeof(str)) {
            throw new TypeError('Invalid type for str argument!');
        }
        const [,varName,varValue] = IntPattern.exec(str);
        this.name = varName;
        this.value = parseInt(varValue);
        this.element = new SEAInt(varName,varValue);
    }

}

// Export Int
module.exports = Int;