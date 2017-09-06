// Require expr from sealang!
const { Expr } = require('sealang');

/*
 * @class Scope
 * 
 * @property {Map} store
 * @property {Map} expr
 * @property {Array} pos
 */
class Scope {

    /*
     * @constructor
     */
    constructor() {
        this.store = new Map([
            ['0',new Map()]
        ]);
        this.expr = new Map();
        this.pos = [0];
    }

    /*
     * @setter Scope.expr 
     * @param {Expr} expr
     * @return Void 0
     */
    set originExpr(expr) {
        // if(expr instanceof Expr === false) {
        //     throw new TypeError('Not an expr');
        // }
        this.expr.set(this.index,expr);
    }

    /*
     * @getter Scope.index 
     * @return String
     */
    get index() {
        return this.pos.toString();
    }

    /*
     * @function Scope.up
     * @param {Expr} expr
     * @return String
     */
    up(expr = new Expr()) {
        this.pos.push(0);
        const I = this.index;
        this.store.set(I,new Map());
        this.expr.set(I,expr);
        return I;
    }

    /*
     * @function Scope.up
     * @return String
     */
    down() {
        const pString = this.index;
        if(pString === '0') {
            throw new Error('Cannot down a scope at level 0!');
        }
        this.store.delete(pString);
        this.pos.pop();
        const I = this.index;
        this.expr.get(I).add( this.expr.get(pString) );
        this.expr.delete(pString);
        return I;
    }

    /*
     * Search for a variable in the whole scope ! 
     * @function Scope.searchDown
     * @param {String} varName
     * @return Void 0
     */
    searchDown(varName) {
        if('string' !== typeof(varName)) {
            throw new TypeError('Invalid type for varName');
        }
        const pos = this.pos.slice(0);
        while(pos.length > 0) {
            const sPos = pos.toString();
            if(this.store.get(sPos).has(varName) === true) {
                return this.store.get(sPos).get(varName);
            }
            pos.pop();
        }
    }

    /*
     * @function Scope.has
     * @function Scope.searchDown
     * @param {String} varName
     * @return Boolean
     */
    has(varName) {
        return typeof(this.searchDown(varName)) !== 'undefined';
    }

    /* 
     * Same as searchDown!
     * @function Scope.searchDown
     * @param {String} varName
     * @return Void 0
     */
    get(varName) {
        return this.searchDown(varName);
    }

    /*
     * @function Scope.add
     * @param {SEA.Element} element
     * @return Void 0
     */
    add(element) {
        this.expr.get(this.index).add(element);
    }

    /*
     * Set a new variable in the current scope!
     * @function Scope.set 
     * @param {String} varName
     * @param {Any} varValue 
     * @return String
     */    
    set(varName,varValue) {
        const I = this.index;
        this.store.get(I).set(varName,varValue);
        return I;
    }

    /*
     * Set a new variable in a specific scope
     * @function Scope.setIn 
     * @param {String} scopeIndex
     * @param {String} varName
     * @param {Any} varValue 
     * @return Boolean
     */  
    setIn(scopeIndex,varName,varValue) {
        if(this.store.has(scopeIndex) === false) {
            return false;
        }
        this.store.get(scopeIndex).set(varName,varValue);
        return true;
    }

}

// Export Scope class as default!
module.exports = Scope;