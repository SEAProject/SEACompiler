const pattern = require('./patternAbstract.js');

// Require Str primitive from sealang !
const { Str } = require('sealang');

// String pattern to match!
const StringPattern = new RegExp(/^String\s+([a-zA-Z0-9]+)\s+=\s+'(.*)'/);

/*
 * @class String
 * @property {String} name
 * @property {String} value
 */
class String extends pattern {

    /*
     * @static String.isMatching 
     * @param {String} str
     */
    static isMatching(str) {
        if('string' !== typeof(str)) {
            throw new TypeError('Invalid type for str argument!');
        }
        return StringPattern.test(str);
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
        const [,varName,varValue] = StringPattern.exec(str);
        this.name = varName;
        this.value = varValue;
        this.element = new Str(varName,varValue);
    }

}

// Export String
module.exports = String;