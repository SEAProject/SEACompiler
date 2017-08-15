const events = require('events');
const { writeFile } = require('fs');
const { promisify } = require('util');
const { join } = require('path');

const asyncWrite = promisify(writeFile);

const IDefaultConfiguration = {
    tabSize: 2
};

/*
 * Expr block code (represent a { expr }).
 */
class Expr extends events {

    constructor({ addblock = true } = {}) {
        super();
        this.closed = false;
        this.addblock = addblock;
        this.rootExpr = undefined;
        this.headerDone = false;
        this.childrensExpr = [];
        this.elements = [];
        this.scope = {
            variables: new Map(),
            routines: new Map()
        };
    }

    setRoot(root) {
        if(root instanceof Expr === false) {
            throw new Error('Invalid root variable. Instanceof have to be equal to Expr.');
        }
        this.rootExpr = root;
        return this;
    }

    setPackage(packageName) {
        if(this.isModule === false) {
            throw new Error('Cannot set package on non-module file!');
        }
        packageName = packageName.split('.').join('::');
        this.elements.push(`package ${packageName};\n`);
        return this;
    }

    breakline() {
        this.elements.push('\n');
        return this;
    }

    add(element) {
        if(this.closed === true) {
            throw new Error('Expr closed... Impossible to add new element!');
        }

        // When we try to add an undefined value!
        if('undefined' === typeof(element)) return;

        // When we try to add this to this...
        if(element === this) return;

        /*
         * When we add multiple element in row!
         */
        if(element instanceof Array) {
            for(let i = 0,len = element.length;i<len;i++) {
                this.add(element[i]);
            }
            return;
        }

        /*
         * When the element is a perl lib.
         */
        const rootDefined = 'undefined' === typeof(element.rootExpr);
        if(element instanceof Dependency) {
            if(this instanceof File === false) {
                throw new Error('Cannot add dependency on non-file expr class!');
            }
            if(rootDefined) {
                if(this.headerDone === true) {
                    this.elements.unshift(element.toString());
                }
                else {
                    this.elements.push(element.toString());
                }
                return;
            }
            else {
                throw new Error('Cannot add new depencies on non-root Expr');
            }
        }

        /*
         * When the element is a return statment (for a routine).
         */
        if(element instanceof ReturnStatment) {
            if(this instanceof Routine) {
                this.elements.push(element.toString());
                this.closed = true;
                this.returnStatment = true;
                this.returnMultiple = element.returnMultiple;
                this.returnType = element.returnedType;
                return;
            }
        }

        /*
         * When the element is a another Expr with no root defined.
         */
        if(element instanceof While) {
            if(element._inner instanceof Expr && rootDefined === true) {
                element._inner.setRoot(this);
            }
        }
        else if(element instanceof Expr && rootDefined === true) {
            element.setRoot(this);
        }

        /*
         * Set SIG routine root!
         */
        if(element instanceof SIG) {
            element.routine.setRoot(this);
        }

        /*
         * Register variables and routines for seeker mechanism.
         */
        if(element instanceof Primitive) {
            this.scope.variables.set(element.name,element);
            this.elements.push( Primitive.constructorOf(element) );
            return;
        }
        if(element instanceof Routine) {
            this.scope.routines.set(element.name,element);
        }

        if(element instanceof Print || element instanceof RoutineShifting || element instanceof PrimeMethod) {
            element = element.toString();
        }

        // Final push!
        this.elements.push( element );
        return this;
    }
    
    hasVar(varName) {
        if(varName == undefined) return false; 
        return this.scope.variables.has(varName);
    }

    hasRoutine(routineName) {
        if(routineName == undefined) return false; 
        return this.scope.routines.has(routineName);
    }

    toString() {
        if(this.elements.length === 0) return '';
        let finalStr = '';
        for(let i = 0,len = this.elements.length;i<len;i++) {
            const element = this.elements[i];
            if(typeof(element) === 'string') {
                finalStr+=element;
            }
            else {
                finalStr+=element.toString();
            }
        }
        return this.addblock === true ? `{\n${finalStr}};\n` : finalStr;
    }

}

/*
 * File class (that represent a entire perl file!)
 */ 
const FileDefaultDepencies = new Set([
    'strict',
    'warnings',
    'stdlib.util',
    'stdlib.array',
    'stdlib.hashmap',
    'stdlib.integer',
    'stdlib.string',
    'stdlib.boolean'
]);

class File extends Expr {

    constructor({name,isModule = false}) {
        super({
            addblock: false
        });
        if(typeof (name) !== 'string') {
            throw new TypeError('Invalid name type!');
        }
        this.name = name;
        this.isModule = isModule;
        FileDefaultDepencies.forEach( DepName => {
            this.add(new Dependency(DepName));
        });
        this.headerDone = true;
    }

    formatCode(filecode) {
        let tabSpace = '  ';
        let incre = 0; 
        return filecode.split('\n').map( line => {
            const cIncre = incre;
            let matchClose = false;
            if(line.match(/{/g)) {
                incre++;
            }
            else if(line.match(/}/g)) {
                incre--;
                matchClose = true;
            }
            if(incre === 0) {
                return line;
            }
            return tabSpace.repeat(matchClose ? incre : cIncre)+line;
        }).join('\n');
    }

    /*
     * Write file to string location
     */
    async write(strLocation) {
        let filecode = super.toString();
        if(this.isModule) {
            filecode += '1;';
        }
        filecode = this.formatCode(filecode);
        console.log(filecode);
        const finalStrPath = join( strLocation, `${this.name}.pl` ); 
        console.log(`Write final final with name => ${finalStrPath}`);
        await asyncWrite(finalStrPath,filecode);

    }

}

/*
 * Dependency class!
 */
class Dependency {

    constructor(pkgName,requiredVars) {
        if(typeof(pkgName) !== 'string') {
            throw new TypeError('Invalid package type');
        }
        pkgName = pkgName.split('.').join('::');
        const ret = 'undefined' === typeof(requiredVars);
        if(ret === false) {
            if(requiredVars instanceof Array === false) {
                requiredVars = Array.from(requiredVars);
            }
        }
        this.value = ret === true ? `use ${pkgName};\n` : `use ${pkgName} qw(${requiredVars.join(' ')});\n`;
    }

    toString() {
        return this.value;
    }

}

/*
 * Routine elements
 * (Shiting,ReturnStatment and Routine)
 */
const SpaceChar = ' '.charCodeAt(0);
class Routine extends Expr {

    constructor({name,args = [],shifting = false} = {}) {
        super({});
        this.anonymous = 'undefined' === typeof(name);
        this.name = this.anonymous === true ? '' : name;
        this.routineName = this.anonymous === true ? 'anonymous' : name;
        const charCode = this.name.slice(-1).charCodeAt(0);
        if(Number.isNaN(charCode) === false && charCode !== SpaceChar) {
            this.name+=' ';
        }
        this.returnStatment = false;
        this.returnType = void 0; 
        this.returnMultiple = false;
        this.add(new RoutineShifting(args,shifting));
    }

    toString() {
        return `sub ${this.name}`+super.toString();
    }

}

/*
 * Routine Shifting
 */
class RoutineShifting {

    constructor(variables,shifting) {
        this.value = '';
        if(variables instanceof Array) {
            if(variables.length > 0) {
                if(shifting) {
                    let finalStr = '';
                    variables.forEach( (element) => {
                        const elName = element instanceof Primitive ? `$${element.name}` : '$'+element;
                        finalStr+='my '+elName+' = shift;\n';
                    });
                    this.value = finalStr;
                }
                else {
                    const finalStr = variables.map( (element) => element instanceof Primitive ? `$${element.name}` : '$'+element ).join(',');
                    this.value = `my (${finalStr}) = @_;\n`;
                }
            }
        }
        else {
            const elName = variables instanceof Primitive ? `$${variables.name}` : '$'+variables;
            this.value = 'my '+elName+' = shift;\n';
        }
    }

    toString() { 
        return this.value;
    }

}

/*
 * Return routine statment!
 */
class ReturnStatment {

    constructor(expr) {
        if(expr instanceof Array) {
            this.returnMultiple = true;
            this.returnedType = [];
            const elems = [];
            expr.forEach( (subExpr,index) => {
                if(subExpr instanceof Primitive) {
                    this.returnedType[index] = expr.libtype.std;
                    elems.push(`$${subExpr.name}`);
                }
                else {
                    this.returnedType[index] = 'any';
                    elems.push(`${subExpr}`);
                }
            });
            this.value = `return (${elems.join(',')});\n`;
        }
        else {
            this.returnMultiple = false;
            if(expr instanceof Primitive) {
                this.returnedType = expr.libtype.std;
                this.value = expr.name === 'anonymous' ? `return ${Primitive.constructorOf(expr)}` : `return $${expr.name};\n`;
            }
            else {
                this.returnedType = 'any'; 
                this.value = `return ${expr};\n`;
            }
        }
    }

    toString() {
        return this.value;
    }

}

/*
 * Print method!
 */
class Print {

    constructor(message,newLine) {
        if(message == undefined) {
            message = '';
        }
        else if(message instanceof Primitive) {
            message = `$${message.name}->valueOf()`;
        }
        const sep = newLine === true ? '\\n' : '';
        this.value = `print(${message}."${sep}");\n`;
    }

    toString() {
        return this.value;
    }

}

/*
 * Process var
 */
const Process = {
    exit: (code = 0) => `exit(${code});\n`,
    argv: () => {
        return 'stdlib::array->new(@ARGV)';
    }
};

/*
 * Condition block
 */
const IConditionBlock = new Set(['if','else','elif']);

class Condition extends Expr {

    constructor(cond,expr) {
        super();
        if(IConditionBlock.has(cond) === false) {
            throw new Error('Unknown condition type!');
        }
        this.cond = cond;
        this.expr = expr instanceof Primitive ? `$${expr.name}->valueOf() == 1` : expr;
        this.expr = this.expr.replace(';','').replace('\n','');
    }

    toString() {
        return `${this.cond} (${this.expr}) `+super.toString();
    }

}

/*
 * While block ! 
 */
class While extends Expr {

    constructor(SEAElement) {
        super();
        if(SEAElement instanceof Arr === false) {
            throw new TypeError('Unsupported type for While block!');
        }
        this._inner = new Expr();
        this.setRoot(this._inner);
        this.incre = new Int('i',0);
        this._inner.add(this.incre);
        this._inner.add(new Int('len',SEAElement.size()));
        const PrimeRef = IPrimeLibrairies.get(SEAElement.template).schema;
        this.add(new PrimeRef('element',SEAElement.get(this.incre)));
    }

    toString() {
        this.add(this.incre.add(1));
        this._inner.add(`while($i < $len) ${super.toString()}`);
        return this._inner.toString();
    }

}

/*
 * Foreach block!
 */
class Foreach extends Expr {

    constructor(SEAElement) {
        super();
        if(SEAElement instanceof HashMap === false) {
            throw new TypeError('Unsupported type for Foreach block!');
        }
    }

    toString() {

    }

}

/*
 * Evaluation (try/catch)
 */
class Evaluation extends Expr {

    constructor() {
        super();
        this.catchExpr = new Condition('if','$@');
        this.catchExpr.add(new Print('$@',true));
    }

    get catch() {
        return this.catchExpr;
    }

    toString() {
        return `eval `+super.toString()+this.catchExpr.toString();
    }

}

/*
 * SIG Event handler
 */
const IAvailableSIG = new Set([
    'CHLD',
    'DIE',
    'INT',
    'ALRM',
    'HUP'
]);

class SIG {

    constructor(code,routine) {
        if(IAvailableSIG.has(code) === false) {
            throw new Error(`Invalid SIG ${code}!`);
        }
        if(routine instanceof Routine === false) {
            throw new Error('Please define a valid routine!');
        }
        this.code = code;
        this.routine = routine;
    }

    toString() {
        return `$SIG{${this.code}} = `+this.routine.toString();
    }

}

/*

    PRIMITIVES TYPES

*/
const IPrimeLibrairies = new Map();
const IPrimeScalarCast = new Set(['stdlib::integer','stdlib::string','stdlib::boolean']);
/*
 * Primitive type class!
 */
class Primitive {

    constructor({type,name,template,value = 'undef'}) {
        if('undefined' === typeof(name)) {
            name = 'anonymous';
        }
        if(IPrimeLibrairies.has(type) === false) {
            throw new Error(`Primitive type ${type} doesn't exist!`);
        }
        this.libtype = IPrimeLibrairies.get(type);
        if(value instanceof Routine) {
            if(value.returnStatment === false) {
                throw new Error(`Cannot assign undefined value from ${value.routineName} to variable ${type}.${name}`);
            }
            if(type !== 'array' && value.returnMultiple === true) {
                throw new Error(`Cannot assign multiple values from ${value.routineName} to variable ${type}.${name}`);
            }
            if(type === 'array') {
                // Implement array type check!
            }
            else {
                this.castScalar = false;
                if(IPrimeScalarCast.has(value.returnType) === true && this.libtype.std === 'scalar') {
                    this.castScalar = true;
                }
                else if(value.returnType !== this.libtype.std) {
                    throw new Error(`Invalid returned type from ${value.routineName}!`);
                }
            }
        }
        if(type === 'array' || type === 'map') {
            this.template = 'undefined' === typeof(template) ? 'scalar' : template;
        }
        this.name = name;
        this.constructValue = value;
        this.value = value;
    }

    method(name,...args) {
        return new PrimeMethod({
            name,
            args,
            element: this
        });
    }

    get type() {
        return this.libtype.std;
    }

    static valueOf(SEAElement,assign = false,inline = false) {
        const rC = inline === true ? '' : ';\n';
        const assignV = assign === true ? `my $${SEAElement.name} = ` : '';
        if(SEAElement instanceof Arr || SEAElement instanceof HashMap) {
            return `${assignV}$${SEAElement.name}->clone()${rC}`;
        }
        else {
            return `${assignV}$${SEAElement.name}->valueOf()${rC}`;
        }
    }

    static constructorOf(SEAElement,inline = false) {
        if(SEAElement instanceof Primitive === false) {
            throw new TypeError('SEAElement Instanceof primitive is false!');
        }
        const rC = inline === true ? '' : ';\n';
        let value       = SEAElement.constructValue;
        const typeOf    = typeof(value);
        if(value instanceof Primitive) {
            return Primitive.valueOf(value,true,inline);
        }
        else if(value instanceof Routine) {
            const castCall = SEAElement.castScalar === true ? '->valueOf()' : '';
            return value.routineName === 'anonymous' ? 
            `my $${SEAElement.name} = ${value.toString()}${castCall}` : 
            `my $${SEAElement.name} = ${value.routineName}()${castCall}${rC}`;
        }
        else if(value instanceof PrimeMethod) {
            return `my $${SEAElement.name} = ${value.toString()}`;
        }
        else {
            let assignHead = ''; 
            if(SEAElement.name !== 'anonymous') {
                assignHead = `my $${SEAElement.name} = `;
            }
            if(SEAElement instanceof Str) {
                return `${assignHead}${SEAElement.type}->new("${value}")${rC}`;
            }
            else if(SEAElement instanceof Scalar) {
                if(typeOf === 'string' || typeOf === 'number') {
                    return typeOf === 'string' ? `${assignHead}"${value}"${rC}` : `${assignHead}${value}${rC}`;
                }
                throw new Error('Invalid type for scalar type!');
            }
            else if(SEAElement instanceof Hash) {
                if(typeOf === 'object') {
                    return `${assignHead}${Hash.ObjectToHash(value)}${rC}`;
                }
                throw new Error('Invalid hash type argument!');
            }
            else if(SEAElement instanceof HashMap) {
                if(SEAElement.template !== 'scalar') {
                    const primeRef = IPrimeLibrairies.get(SEAElement.template).schema;
                    for(let [k,v] of Object.entries(value)) {
                        value[k] = Primitive.constructorOf(new primeRef(void 0,v),true);
                    }
                }
                return `${assignHead}${SEAElement.type}->new(${Hash.ObjectToHash(value)})${rC}`;
            }
            else if(SEAElement instanceof Arr && SEAElement.template !== 'scalar') {
                const primeRef = IPrimeLibrairies.get(SEAElement.template).schema;
                value = value.map( val => {
                    return Primitive.constructorOf(new primeRef(void 0,val),true); 
                });
                return `${assignHead}${SEAElement.type}->new(${value})${rC}`;
            }
            return `${assignHead}${SEAElement.type}->new(${value})${rC}`;
        }
    }

}

/*
 * Primitive Method
 */
class PrimeMethod {

    constructor({name,element,args = []}) {
        this.name = name;
        this.element = element;
        this.args = args.map( val => {
            return val instanceof Primitive ? Primitive.valueOf(val,false,true) : val;
        });
    }

    toString() {
        return `$${this.element.name}->${this.name}(${this.args.join(',')});\n`;
    }

}

/*
 * String type!
 */
class Str extends Primitive {

    constructor(varName,valueOf) {
        super({
            type: 'string',
            name: varName,
            value: valueOf,
        });
    }

    valueOf() {
        return this.method('valueOf');
    }

    freeze() {
        return this.method('freeze');
    }

    length() {
        return this.method('length');
    }

    isEqual(element) {
        if("undefined" === typeof(element)) {
            throw new Error('Undefined element');
        }
        return this.method('isEqual',element);
    }

    substr(start,end) {
        return this.method('substr',start,end);
    }

    clone() {
        return this.method('clone');
    }

    slice(start,end) {
        return this.method('slice',start,end);
    }

    last() {
        return this.method('last');
    }

    charAt(index) {
        return this.method('charAt',index);
    }

    charCodeAt(index) {
        return this.method('charCodeAt',index);
    }

    repeat(count) {
        if("undefined" === typeof(count)) {
            count = 1;
        }
        return this.method('repeat',count);
    }

    constains(substring) {
        return this.method('contains',substring);
    }

    containsRight(substring) {
        return this.method('containsRight',substring);
    }

    split(carac) {
        return this.method('split',carac);
    }

    trim() {
        return this.method('trim');
    }

    trimLeft() {
        return this.method('trimLeft');
    }

    trimRight() {
        return this.method('trimRight');
    }

    toLowerCase() {
        return this.method('toLowerCase');
    }

    toUpperCase() {
        return this.method('toUpperCase');
    }

}

/*
 * Integer type!
 */
class Int extends Primitive {

    constructor(varName,valueOf) {
        super({
            type: 'integer',
            name: varName,
            value: valueOf,
        });
    }

    valueOf() {
        return this.method('valueOf');
    }

    freeze() {
        return this.method('freeze');
    }

    length() {
        return this.method('length');
    }

    add(value) {
        if('undefined' === typeof(value)) {
            throw new Error('Undefined value');
        }
        return this.method('add',value);
    }

    sub(value) {
        if('undefined' === typeof(value)) {
            throw new Error('Undefined value');
        }
        return this.method('sub',value);
    }

    mul(value) {
        if('undefined' === typeof(value)) {
            throw new Error('Undefined value');
        }
        return this.method('mul',value);
    }

    div(value) {
        if('undefined' === typeof(value)) {
            throw new Error('Undefined value');
        }
        return this.method('div',value);
    }

}

/*
 * Boolean type!
 */
class Bool extends Primitive {

    constructor(varName,valueOf) {
        super({
            type: 'boolean',
            name: varName,
            value: valueOf ? 1 : 0,
        });
    }

    valueOf() {
        return this.method('valueOf');
    }

}

/*
 * Array type!
 */
class Arr extends Primitive {

    constructor(name,template,value = []) {
        super({
            type: 'array',
            name,
            template,
            value
        });
    }

    freeze() {
        return this.method('freeze');
    }

    forEach(routine) {
        if(routine instanceof Routine === false) {
            throw new TypeError('Invalid routine type!');
        }
        return this.method('forEach',routine);
    }

    map(routine) {
        if(routine instanceof Routine === false) {
            throw new TypeError('Invalid routine type!');
        }
        return this.method('map',routine);
    }

    every(routine) {
        if(routine instanceof Routine === false) {
            throw new TypeError('Invalid routine type!');
        }
        return this.method('every',routine);
    }

    get(index) {
        if("undefined" === typeof(index)) {
            throw new Error('Undefined index argument');
        }
        return this.method('get',index);
    }

    size() {
        return this.method('size');
    }

}

/*
 * Hashmap type!
 */
class HashMap extends Primitive {

    constructor(name,template,value = {}) {
        super({
            type: 'map',
            name,
            template,
            value
        });
    }

    freeze() {
        return this.method('freeze');
    }

    clear() {
        return this.method('clear');
    }

    keys() {
        return this.method('keys');
    }

    values() {
        return this.method('values');
    }

    forEach(routine) {
        if(routine instanceof Routine === false) {
            throw new TypeError('Invalid routine type!');
        }
        return this.method('forEach',routine);
    }

    size() {
        return this.method('size');
    }

    get(value) {
        return this.method('get',value);
    }

    set(key,value) {
        return this.method('set',key,value);
    }

    delete(key) {
        if('undefined' === typeof(key)) {
            throw new TypeError('Undefined key!');
        }
        return this.method('delete',key);
    }

}

/*
 * Classical Perl Hash type
 */
class Hash extends Primitive {

    constructor(varName,valueOf) {
        super({
            type: 'hash',
            name: varName,
            value: valueOf,
        });
    }

    static ObjectToHash(object) {
        if(typeof(object) !== 'object') {
            throw new TypeError('Invalid object type!');
        }

        const parseArray = function(arr) {
            arr = arr.map( arrV => {
                const typeOf = typeof(arrV);
                if(arrV instanceof Array) {
                    return parseArray(arrV);
                }
                else if(typeOf === 'object') {
                    return parse(arrV);
                }
                else if(typeOf === 'string') {
                    return `"${arrV}"`;
                }
                else if(typeOf === 'boolean') {
                    return `${arrV === true ? 1 : 0}`;
                }
                else {
                    return arrV.toString();
                }
            });
            return `(${arr.join(',')})`;
        };

        const parse = function(_O) {
            let ret = '{';
            for(let k in _O) {
                const v = _O[k];
                const typeOf = typeof(v);
                if(v instanceof Array) {
                    ret+=`${k} => ${parseArray(v)},`;
                }
                else if(typeOf === 'object') {
                    ret+=`${k} => ${parse(v)},`;
                }
                else if(typeOf === 'string') {
                    ret+=`${k} => ${v},`;
                }
                else if(typeOf === 'boolean') {
                    ret+=`${k} => ${v === true ? 1 : 0},`;
                }
                else {
                    ret+=`${k} => ${v.toString()},`;
                }
            }
            return ret.slice(0,-1)+'}';
        };

        return parse(object);
    }
    
}

/*
 * Classical Scalar type!
 */
class Scalar extends Primitive {
    constructor(varName,valueOf) {
        super({
            type: 'scalar',
            name: varName,
            value: valueOf,
        });
    }
}

// Define prime scheme
IPrimeLibrairies.set('string',{
    std: 'stdlib::string',
    schema: Str
});

IPrimeLibrairies.set('integer',{
    std: 'stdlib::integer',
    schema: Int
});

IPrimeLibrairies.set('boolean',{
    std: 'stdlib::boolean',
    schema: Bool
});

IPrimeLibrairies.set('array',{
    std: 'stdlib::array',
    schema: Arr
});

IPrimeLibrairies.set('map',{
    std: 'stdlib::hashmap',
    schema: HashMap
});

IPrimeLibrairies.set('hash',{
    std: 'hash',
    schema: Hash
});


IPrimeLibrairies.set('scalar',{
    std: 'scalar',
    schema: Scalar
});


// Export every schema class!
module.exports = {
    File,
    Process,
    Dependency,
    Expr,
    Routine,
    ReturnStatment,
    Condition,
    SIG,
    While,
    Foreach,
    Print,
    Primitive,
    Hash,
    HashMap,
    Str,
    Int,
    Bool,
    Arr,
    Scalar,
    PrimeMethod,
    Evaluation
};