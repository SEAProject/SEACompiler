// Node core module!
const events        = require('events');
const { readFile }  = require('fs');
const { promisify } = require('util');
const { extname, join }   = require('path');
const chalk = require('chalk');

// SEA Lang schema API
const {File} = require('sealang');

// Async Node core method!
const readFileAsynchronous = promisify(readFile);

const Patterns = [
    join ( __dirname , 'patterns/string.js' ),
    join ( __dirname , 'patterns/int.js' )
];

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
        console.log('Loading all patterns...');
        Patterns.forEach( localPath => {
            console.log(`Loading ${localPath}`);
            try {
                const classInstance = require(localPath);
                this.patterns.add(classInstance);
            }
            catch(E) {
                console.log(`Failed to load ...`);
                console.error(E);
            }
        });
    }

    /*
     * @function Compiler.transpile
     * @param {String} fileSourceName
     * @return Promise<void 0>
     */
    async transpile(fileSourceName = 'test') {
        const buf = await readFileAsynchronous(this.source).catch( E => {
            console.error(E);
        });

        const transpiledCode = new File({
            name: fileSourceName,
            isModule: false
        });
        transpiledCode.breakline();
        const variablesRegistery = new Set();
        
        console.log('---------');
        const lines = buf.toString().split('\n');
        lines.forEach( (lineValue) => {
            if(lineValue === '\n') {
                transpiledCode.breakline();
                return;
            }
            console.log(chalk.bold.yellow(lineValue));
            for(let element of this.patterns) {
                try {
                    const ret = element.isMatching(lineValue);
                    console.log(`Check ${chalk.cyan.bold(element.name)} :: ${ret === true ? chalk.green.bold(ret.toString()) : chalk.red.bold(ret.toString())}`);
                    if(ret === true) {
                        const _v = new element(lineValue);
                        //variablesRegistery.add(_v);
                        transpiledCode.add(_v.seaElement);
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

        await transpiledCode.write( join( __dirname, 'compiled' ) );
    }

}

// Export compiler;
module.exports = {
    Compiler
};