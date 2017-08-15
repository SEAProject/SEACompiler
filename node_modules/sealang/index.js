const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.yellow.bold('Starting SEALang compilation...'));
const [,,path] = process.argv; 
if(path == undefined) {
    console.error(chalk.red.bold('No valid path available in the command arguments...'));
    process.exit(0);
}

console.log(path);