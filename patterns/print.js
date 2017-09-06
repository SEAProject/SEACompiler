const pattern = require('./patternAbstract.js');

// Require Str primitive from sealang !
const { Print: SEAPrint } = require('sealang');

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
        return Print.pattern.test(str);
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
        const [,varName,varValue] = Print.pattern.exec(str);
        this.name = varName;
        this.value = parseInt(varValue);
        this.element = new SEAPrint(varName,varValue);
    }

}
Print.pattern = new RegExp(/^Int\s+([a-zA-Z]+[0-9]*)\s+=\s+([0-9]+)/);

// Export Int
module.exports = Print;