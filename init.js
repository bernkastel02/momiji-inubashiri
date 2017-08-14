'use strict'
let exec = require('child_process').exec
let chalk = require('chalk')
let ready = chalk.green("[READY]")
let logs = chalk.yellow("[LOG]")
exec("pkill -9 rethinkdb")
console.log(`${logs} Killing other RethinkDB processes.`)
setTimeout(() => {
    exec("rethinkdb")
    console.log(`${ready} DB Ready!`)
}, 1000)
