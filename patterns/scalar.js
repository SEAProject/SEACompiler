const pattern = require('./patternAbstract.js');

// Require Str primitive from sealang !
const { Scalar: SEAScalar } = require('sealang');

// String pattern to match!
const ScalarPattern = new RegExp(/^Scalar\s+([a-zA-Z]+[0-9]*)\s+=\s+(.*)/);

/*
 * @class Scalar
 * @property {String} name
 * @property {String} value
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
        return ScalarPattern.test(str);
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
        const [,varName,varValue] = ScalarPattern.exec(str);
        this.name = varName;
        this.value = varValue;
        this.element = new SEAScalar(varName,varValue);
    }

}

// Export String
module.exports = Scalar;