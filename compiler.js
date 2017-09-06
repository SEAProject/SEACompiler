// Node core module!
const events        = require('events');
const { readFile }  = require('fs');
const { promisify } = require('util');
const { join }   = require('path');
const chalk = require('chalk');

// SEA Lang schema API
const {File,PrimeMethod,Dependency} = require('sealang');

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
    import:         new RegExp(/^\s*\t*import\s{?([*a-zA-Z0-9\s,]+)}?\sfrom\s([a-zA-Z0-9.]+)\n?/),
    breakLine:      new RegExp(/^\s*\r*\n?$/),
    varMethod:      new RegExp(/^\s*\t*([a-zA-Z]+[0-9]*)\.{1}[a-zA-Z]+/),
    varAssign:      new RegExp(/^\s*\t*([a-zA-Z]+[0-9]*)\s+=\s+(.*)/),
    getMethods:     new RegExp(/.{1}([a-zA-Z]+[0-9]*)\(?([a-zA-Z0-9,'"$@]+)?\)?/,'gm'),
    openBracket:    new RegExp(/^\s*\t*{/),
    closeBracket:   new RegExp(/^\s*\t*}/),
    isVar:          new RegExp(/^([a-zA-Z]+[0-9]*)$/),
    isString:       new RegExp(/^('|")[a-zA-Z0-9\s]+('|")$/)
};

// Scope core
const Scope = require('./core/scope.js');

/*
 * @class Compiler @extend events
 * 
 * @property {String} source
 * @property {Set} patterns
 * @property {Scope} scope 
 * 
 */
class Compiler extends events {

    /*
     * @constructor 
     * @param {String} source
     */
    constructor(source) {
        super();
        if('undefined' === typeof(source)) {
            throw new Error('Please defined a source destination!');
        }
        this.source = source;
        this.patterns = new Set();
        this.scope = new Scope();
        console.log(chalk.dim.bold('Loading all patterns...'));
        Patterns.forEach( localPath => {
            try {
                const classInstance = require(localPath);
                console.log(`Loading ${chalk.cyan.bold('Primitive')} ${chalk.green.bold(classInstance.name)}`);
                this.patterns.add(classInstance);
            }
            catch(E) {
                console.log('Failed to load ...');
                console.error(E);
            }
        });
    }

    /*
     * @function Compiler.checkAssign
     * @param {String} strLine
     * @return Boolean
     */
    checkAssign(strLine) {
        if(CompilerRegex.varAssign.test(strLine) === false) return false;
        const [,varName,varValue] = CompilerRegex.varAssign.exec(strLine);
        console.log(`${chalk.dim.bold('Update variable')} detected :: ${chalk.bold.cyan(varName)} => ${chalk.bold.green(varValue)}`);
        if(this.scope.has(varName) === false) {
            throw new Error(`Undefined variable ${varName}`);
        }
        const element = this.scope.get(varName);
        this.scope.add(new PrimeMethod({
            name: 'updateValue',
            element,
            args: this.checkVarsTypes([varValue])
        }));
        console.log('---------');
        return true;
    }

    /*
     * @function Compiler.checkMethod
     * @param {String} strLine
     * @return Boolean
     */
    checkMethod(strLine) {
        if(CompilerRegex.varMethod.test(strLine) === false) return false;
        const [,varName] = CompilerRegex.varMethod.exec(strLine);
        console.log(`${chalk.dim.bold('Method call')} detected on :: ${chalk.bold.cyan(varName)}`);
        if(this.scope.has(varName) === false) {
            throw new Error(`Undefined variable ${varName}`);
        }
        const element = this.scope.get(varName);
        let result;
        while( (result = CompilerRegex.getMethods.exec(strLine) ) !== null) {
            let args = [];
            const [,methodName,methodValue] = result;
            if(methodName === varName) continue;
            console.log(`\t[ ${chalk.bold.cyan(methodName)} -> ${chalk.bold.yellow(methodValue)} ]`);

            if('undefined' !== typeof(methodValue)) {
                args = this.checkVarsTypes(methodValue.split(','));
            }
            this.scope.add(new PrimeMethod({
                name: methodName,
                element,
                args
            }));
        }
        console.log('---------');
        return true;
    }

    /*
     * @function Compiler.checkBrackets
     * @param {String} strLine
     * @return Boolean
     */
    checkBrackets(strLine) {
        if(CompilerRegex.openBracket.test(strLine) === true) {
            console.log(chalk.dim.bold('Open bracket detected!'));
            console.log('---------');
            this.scope.up();
            return true;
        }
        else if(CompilerRegex.closeBracket.test(strLine) === true) {
            console.log(chalk.dim.bold('Close bracket detected!'));
            console.log('---------');
            this.scope.down();
            return true;
        }
        return false;
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
                console.log(`\t -> ${chalk.green.bold('Variable matched')} :: ${chalk.cyan.bold(varName)}`);
                if(this.scope.has(varName) === false) {
                    throw new Error(`Undefined variable ${varName}`);
                }
                return this.scope.get(varName);
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
        this.scope.originExpr = transpiledCode;
        
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

            // Match dependency
            if(CompilerRegex.import.test(lineValue) === true) {
                const [,argStr,pkgName] = CompilerRegex.import.exec(lineValue);
                console.log(`Dependency matched :: ${chalk.green.bold(pkgName)}`);
                console.log('---------');
                if(argStr === '*') {
                    transpiledCode.add( new Dependency(pkgName,void 0) );
                }
                else {
                    transpiledCode.add( new Dependency(pkgName,argStr.split(',').map( v => v.trim() )) );
                }
                return;
            }

            if(this.checkBrackets(lineValue) === true) return;
            if(this.checkAssign(lineValue) === true) return;
            if(this.checkMethod(lineValue) === true) return;

            console.log(chalk.bold.yellow(lineValue));
            for(let PrimitiveType of this.patterns) {
                try {
                    const ret = PrimitiveType.isMatching(lineValue);
                    console.log(`Check ${chalk.cyan.bold(PrimitiveType.name)} :: ${ret === true ? chalk.green.bold(ret.toString()) : chalk.red.bold(ret.toString())}`);
                    if(ret === true) {
                        const [,varName,varValue] = PrimitiveType.pattern.exec(lineValue);
                        console.log(`var ${chalk.green.bold(varName)} -> ${varValue}`);
                        const arg = this.checkVarsTypes([varValue]);
                        const seaElement = new PrimitiveType.element(varName,arg.shift());
                        this.scope.set(varName,seaElement);
                        this.scope.add(seaElement);
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

        console.log('\n');
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