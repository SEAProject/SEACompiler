// Node core module!
const events        = require('events');
const { readFile }  = require('fs');
const { promisify } = require('util');
const { extname, join }   = require('path');
const chalk = require('chalk');

// SEA Lang schema API
const {File,PrimeMethod} = require('sealang');

// Async Node core method!
const readFileAsynchronous = promisify(readFile);

// Patterns path
const Patterns = [
    join ( __dirname , 'patterns/string.js' ),
    join ( __dirname , 'patterns/int.js' ),
    join ( __dirname , 'patterns/scalar.js' )
];

// Regex 
const CompilerRegex = {
    breakLine:  new RegExp(/^\s*\r*\n?$/),
    varMethod:  new RegExp(/^([a-zA-Z]+[0-9]*)\.{1}[a-zA-Z]+/),
    varAssign:  new RegExp(/^([a-zA-Z]+[0-9]*)\s+=\s+(.*)/),
    getMethods: new RegExp(/.{1}([a-zA-Z]+[0-9]*)\(?([a-zA-Z0-9,'"$@]+)?\)?/,'gm'),
    isVar:      new RegExp(/^([a-zA-Z]+[0-9]*)$/),
    isString:   new RegExp(/^('|")[a-zA-Z0-9\s]+('|")$/)
};

/*
 * @class Compiler @extend events
 * @property {String} source
 */
class Compiler extends events {

    /*
     * @constructor 
     * @param {String} source
     */
    constructor(source) {
        super();
        if("undefined" === typeof(source)) {
            throw new Error('Please defined a source destination!');
        }
        this.source = source;
        this.patterns = new Set();
        this.variablesRegistery = new Map();
        console.log(chalk.dim.bold('Loading all patterns...'));
        Patterns.forEach( localPath => {
            try {
                const classInstance = require(localPath);
                console.log(`Loading ${chalk.cyan.bold('Primitive')} ${chalk.green.bold(classInstance.name)}`);
                this.patterns.add(classInstance);
            }
            catch(E) {
                console.log(`Failed to load ...`);
                console.error(E);
            }
        });
    }

    /*
     * @function Compiler.checkAssign
     * @param {SEA.File} code 
     * @param {String} strLine
     * @return Boolean
     */
    checkAssign(code,strLine) {
        if(CompilerRegex.varAssign.test(strLine) === false) return false;
        const [,varName,varValue] = CompilerRegex.varAssign.exec(strLine);
        console.log(`${chalk.dim.bold('Update variable')} detected :: ${chalk.bold.cyan(varName)} => ${chalk.bold.green(varValue)}`);
        if(this.variablesRegistery.has(varName) === false) {
            throw new Error(`Undefined variable ${varName}`);
        }
        code.add(this.variablesRegistery.get(varName).updateValue(varValue));
        console.log('---------');
        return true;
    }

    /*
     * @function Compiler.checkMethod
     * @param {SEA.File} code 
     * @param {String} strLine
     * @return Boolean
     */
    checkMethod(code,strLine) {
        if(CompilerRegex.varMethod.test(strLine) === false) return false;
        const [,varName] = CompilerRegex.varMethod.exec(strLine);
        console.log(`${chalk.dim.bold('Method call')} detected on :: ${chalk.bold.cyan(varName)}`);
        if(this.variablesRegistery.has(varName) === false) {
            throw new Error(`Undefined variable ${varName}`);
        }
        const element = this.variablesRegistery.get(varName);
        let result;
        while( (result = CompilerRegex.getMethods.exec(strLine) ) !== null) {
            let args = [];
            const [,methodName,methodValue] = result;
            console.log(`methodName => ${chalk.bold.green(methodName)}`);
            console.log(`methodValue => ${chalk.bold.yellow(methodValue)}`);

            if('undefined' !== typeof(methodValue)) {
                args = this.checkVarsTypes(methodValue.split(','));
            }
            code.add(new PrimeMethod({
                name: methodName,
                element,
                args
            }));
        }
        console.log('---------');
        return true;
    }

    /*
     * @function Compiler.checkVarsTypes
     * @param {Array} varsArray
     * @return Void 0
     */
    checkVarsTypes(varsArray) {
        if('undefined' === typeof(varsArray)) {
            throw new TypeError('Undefined varsArray');
        }
        return varsArray.map( vStr => {
            if(CompilerRegex.isVar.test(vStr) === true) {
                const [,varName] = CompilerRegex.isVar.exec(vStr);
                console.log(`${chalk.green.bold('checkVarsTypes')} -> var matched :: ${chalk.cyan.bold(varName)}`);
                if(this.variablesRegistery.has(varName) === false) {
                    return vStr;
                }
                return this.variablesRegistery.get(varName);
            }
            return vStr;
        });
    }

    /*
     * @function Compiler.transpile
     * @param {String} fileSourceName
     * @return Promise<void 0>
     */
    async transpile(fileSourceName = 'test') {
        console.time(chalk.bold.green('compilation'));
        const buf = await readFileAsynchronous(this.source).catch( E => {
            console.error(E);
        });

        const transpiledCode = new File({
            name: fileSourceName,
            isModule: false
        });
        transpiledCode.breakline();
        
        console.log('---------');
        const lines = buf.toString().split('\n');
        lines.forEach( (lineValue) => {

            // Check for linebreak!
            if(CompilerRegex.breakLine.test(lineValue) === true) {
                console.log(chalk.dim.bold('Breakline detected!'));
                console.log('---------');
                transpiledCode.breakline();
                return;
            }

            // Check variable & methods assignments!
            if(this.checkAssign(transpiledCode,lineValue) === true) return;
            if(this.checkMethod(transpiledCode,lineValue) === true) return;

            console.log(chalk.bold.yellow(lineValue));
            for(let PrimitiveType of this.patterns) {
                try {
                    const ret = PrimitiveType.isMatching(lineValue);
                    console.log(`Check ${chalk.cyan.bold(PrimitiveType.name)} :: ${ret === true ? chalk.green.bold(ret.toString()) : chalk.red.bold(ret.toString())}`);
                    if(ret === true) {
                        const Prime = new PrimitiveType(lineValue);
                        this.variablesRegistery.set(Prime.name,Prime.seaElement);
                        transpiledCode.add(Prime.seaElement);
                        break;
                    }
                }
                catch(E) {
                    console.log(chalk.bold.yellow('Failed to transpile!'));
                    console.error(chalk.bold.red(E));
                    process.exit(1);
                }
            }
            console.log('---------');
        });

        console.log('\n\n');
        console.log(chalk.cyan.bold('Generating Perl5 stdout :'));
        const stdout = await transpiledCode.write( join( __dirname, 'compiled' ) );
        console.log(chalk.dim.bold(stdout));
        console.timeEnd(chalk.bold.green('compilation'));
    }

}

// Export compiler;
module.exports = {
    Compiler
};