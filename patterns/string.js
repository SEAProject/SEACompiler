// Require Str primitive from sealang !
const { Str } = require('sealang');

/*
 * @class String
 */
class String {

    /*
     * @static String.isMatching 
     * @param {String} str
     */
    static isMatching(str) {
        if('string' !== typeof(str)) {
            throw new TypeError('Invalid type for str argument!');
        }
        return String.pattern.test(str);
    }

}

String.element = Str;
String.pattern = new RegExp(/^\s*\t*String\s+([a-zA-Z]+[0-9]*)\s+=\s+(.*)/);

// Export String
module.exports = String;