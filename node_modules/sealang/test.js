const {
    File,
    Print,
    While,
    HashMap,
    Int,
    Str
} = require('./schema.js');
const { join } = require('path');

setImmediate( async function() {

    const perlCode = new File({
        name: 'test',
        isModule: false
    });

    perlCode.breakline();
    const hM = new HashMap('test','integer',{
        'a': 5,
        'b': 10
    });
    perlCode.add(hM);
    perlCode.breakline();
    perlCode.add(hM.forEach());

    await perlCode.write( join( __dirname, '..' , 'source' ) );
    process.exit(0);

});