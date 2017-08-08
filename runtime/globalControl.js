'use strict'
/*
In case we want custom commands in the future.
*/
var cus = require("./commands/global.js")
var commands = []
var alias = []

if (cus !== null) {
    for (var l in cus.Commands) {
        if (commands[l] && !cus.Commands[l].overwrite && typeof commands[l] !== 'function') {
            throw new Error('Custom commands cannot replace default commands without overwrite enabled!')
        }
        commands[l] = cus.Commands[l]
    }
}

exports.Commands = commands
exports.Aliases = alias
