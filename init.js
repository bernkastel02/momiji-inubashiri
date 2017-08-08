'use strict'
let exec = require('child_process').exec
let chalk = require('chalk')
let ready = chalk.green("[READY]")
exec("rethinkdb")
console.log(`${ready} DB Ready!`)
