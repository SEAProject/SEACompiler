const pattern = require('./patternAbstract.js');

// Require Str primitive from sealang !
const { Print: SEAPrint } = require('sealang');

// String pattern to match!
const PrintPattern = new RegExp(/^Int\s+([a-zA-Z]+[0-9]*)\s+=\s+([0-9]+)/);

/*
 * @class Print
 * @property {String} name
 * @property {Number} value
 */
class Print extends pattern {

    /*
     * @static Int.isMatching 
     * @param {String} str
     */
    static isMatching(str) {
        if('string' !== typeof(str)) {
            throw new TypeError('Invalid type for str argument!');
        }
        return PrintPattern.test(str);
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
        const [,varName,varValue] = PrintPattern.exec(str);
        this.name = varName;
        this.value = parseInt(varValue);
        this.element = new SEAInt(varName,varValue);
    }

}

// Export Int
module.exports = Int;