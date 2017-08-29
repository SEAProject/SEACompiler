// Require dependencies
const { Compiler } = require('./compiler.js');
const { join } = require('path');

// Main handler!
async function main() {
    const SEA_Output = new Compiler( join( __dirname, 'test.sea' ) );
    await SEA_Output.transpile('test');
}

// Call main.
main(); 