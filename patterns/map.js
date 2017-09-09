// Require Str primitive from sealang !
const { HashMap } = require('sealang');

/*
 * @class Int
 */
class Map {

    /*
     * @static Int.isMatching 
     * @param {String} str
     */
    static isMatching(str) {
        if('string' !== typeof(str)) {
            throw new TypeError('Invalid type for str argument!');
        }
        return Map.pattern.test(str);
    }

}

Map.element = HashMap;
Map.pattern = new RegExp(/^\s*\t*Map<(Int|String|Boolean|Scalar)>\s([a-zA-Z]+[0-9]*)\s/);

// Export Int
module.exports = Map;