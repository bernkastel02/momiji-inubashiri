"use strict"
const Eris = require("eris")
const betaToken = "MzQzOTU4MjE0MTQ2MjYxMDAz.DGoCUw.EuHVup_aZ7a - XA58hl7AWLLEBhw"
const stableToken = "MzM5Mjg3MTg0MzgzNDEwMTc3.DFhxVQ.yX6QtdtbNVk7weVvZQooGhDEm0M"
var current = stableToken
const bot = new Eris(current, {
    disableEvents: {
        "TYPING_START": true
    }
})

if (current == stableToken) {
    bot.db = require("rethinkdbdash")({
        servers: [{
            host: "178.32.232.165",
            port: 28016
        }],
        silent: true
    })
}
else if (current == betaToken) {
    bot.db = require("rethinkdbdash")({
        servers: [{
            host: "178.32.232.165",
            port: 28017
        }],
        silent: true
    })
}
var ws = {}
ws.queue = {}
const chalk = require('chalk')
const errors = chalk.red("[ERROR]")
const ready = chalk.green("[READY]")
const log = chalk.yellow("[LOG]")
const masters = ["241445525574909953", "161014852368859137"]
const runtime = require('./runtime/runtime.js')
var globals = runtime.globalControl.Commands
const p = require("./Leveling.js")
const person = new p()
const version = require("./version.json")
bot.person = person
bot.version = version
var timeout = []
require("./init.js")

bot.on("ready", () => {
    if (bot.user.username == "Momiji") {
        console.log(`${ready} Eris Ready! - ${new Date(Date.now()).toLocaleString()}`)
        setTimeout(() => {
            bot.editStatus("online", {
                name: `momiji help | ${bot.guilds.size} servers!`
            })
        }, 2000)
        setInterval(() => {
            bot.editStatus("online", {
                name: `momiji help | ${bot.guilds.size} servers!`
            })
        }, 3600000) // 1 hour
    }
    if (bot.user.username == "Momiji Beta") {
        console.log(`${ready} Eris Ready! - ${new Date(Date.now()).toLocaleString()}`)
        setTimeout(() => {
            bot.editStatus("online", {
                name: `wan help | ${bot.guilds.size} servers!`
            })
        }, 2000)
        setInterval(() => {
            bot.editStatus("online", {
                name: `wan help | ${bot.guilds.size} servers!`
            })
        }, 3600000) // 1 hour    
    }
    bot.guilds.forEach(g => {
        if (bot.guilds.get(g.id).members.get(bot.user.id).voiceState.channelID) {
            console.log(`${log} I'm in a voice channel, but due to restart I'm leaving it.`)
            let channel = bot.guilds.get(g.id).members.get(bot.user.id).voiceState.channelID
            bot.leaveVoiceChannel(channel)
            bot.db.db('momiji').table('guilds').get(g.id).run().then(guild => {
                guild.queue.link = []
                guild.queue.info = []
                bot.db.db('momiji').table('guilds').get(g.id).update(guild).run()
            }).catch(e => {
                console.log(`${errors} ${e}`)
            })
        }
    })
})

bot.on("messageCreate", (msg) => {
    var cmd
    var suffix
    msg.guild = msg.channel.guild
    if (msg.author.bot == true) return
    if (!msg.channel.guild) {
        return
    }
    bot.db.db('momiji').table('users').get(msg.author.id).run().then((res) => {
        if (!res) {
            bot.db.db('momiji').table('users').insert({
                id: msg.author.id,
                level: 0,
                exp: 0,
                credits: 0,
                maximum_exp: 50,
                blacklist: false
            }).run()
            console.log(`${log} Added new user.`)
        }
    }).catch(e => {
        console.log(`${errors} ${e} - bot.js:98`)
    })
    if (current == betaToken) {
        bot.db.db('momiji').table('guilds').get(msg.guild.id).run().then((res) => {
            if (!res) {
                bot.db.db('momiji').table('guilds').insert({
                    id: msg.guild.id,
                    vip_level: 0,
                    queue: {
                        link: [],
                        info: []
                    },
                    prefix: "wan ",
                    blacklist: false
                }).run()
                console.log(`${log} Added new guild.`)
            }
        })
    }
    if (current == stableToken) {
        bot.db.db('momiji').table('guilds').get(msg.guild.id).run().then((res) => {
            if (!res) {
                bot.db.db('momiji').table('guilds').insert({
                    id: msg.guild.id,
                    vip_level: 0,
                    queue: {
                        link: [],
                        info: []
                    },
                    prefix: "momiji ",
                    blacklist: false
                }).run()
                console.log(`${log} Added new guild.`)
            }
        })
    }
    bot.db.db('momiji').table('guilds').get(msg.guild.id).run().then((res) => {
        var prefix = res.prefix
        if (msg.content.indexOf(prefix) === 0) {
            cmd = msg.content.substring(prefix.length).split(' ')[0].toLowerCase() // Command Trigger
            suffix = msg.content.substr(prefix.length).split(' ')
            suffix = suffix.slice(1, suffix.length).join(' ') // Everything after command trigger
        }
        if (cmd) { // What to do when a command is triggered
            if (globals[cmd]) {
                if (typeof globals[cmd] !== 'object') { // All commands should be objects
                    return
                }
                try {
                    bot.db.db('momiji').table('guilds').get(msg.channel.guild.id).run().then(guild => {
                        if (guild.blacklist == true) {
                            return
                        }
                    })
                    bot.db.db('momiji').table('users').get(msg.author.id).run().then(user => {
                        if (!user) {
                            msg.channel.createMessage("Woah there! You're not in my database. Sorry about this interruption, but I need to create you. This will only take a second.")
                            bot.db.db('momiji').table('users').insert({
                                id: msg.author.id,
                                level: 0,
                                exp: 0,
                                credits: 0,
                                maximum_exp: 50,
                                blacklist: false
                            }).run()
                            return console.log(`${log} Added new user.`)
                        }
                        if (user.blacklist == true) {
                            return
                        }
                    })
                    if (globals[cmd].cooldown_array.indexOf(msg.author.id) > -1) {
                        let date = new Date(globals[cmd].cooldown_array[msg.author.id]._idleTimeout),
                            seconds = date.getSeconds()
                        msg.channel.createMessage("Slow down! You can use this again after `" + seconds + "` seconds.")
                        return
                    }
                    else {
                        if (masters.indexOf(msg.author.id) > -1) {
                            // nothing
                        }
                        else if (globals[cmd].cooldown_time != 0) { // >:(
                            globals[cmd].cooldown_array.push(msg.author.id)
                            globals[cmd].cooldown_array[msg.author.id] = setTimeout(() => {
                                let index = globals[cmd].cooldown_array.indexOf(msg.author.id)
                                globals[cmd].cooldown_array.splice(index, 1)
                            }, globals[cmd].cooldown_time)
                        }
                        console.log(`${log} ${msg.author.username}#${msg.author.discriminator} > ${msg.channel.guild.name} > Ran ${globals[cmd].name}`)
                        globals[cmd].fn(msg, suffix, bot) // ACTUAL COMMAND TRIGGER HERE
                    }
                }
                catch (err) {
                    if (typeof err == "object") {
                        err = JSON.stringify(err)
                    }
                    msg.channel.createMessage("Command error. I stopped the command process and logged the error to the console.")
                    console.log(`${errors} ${err}`)
                }
            }
            if (cmd == "help") {
                let array = []
                for (let i in globals) { // Pushed all commands into an array with their name and help message
                    array.push({
                        name: globals[i].name,
                        value: "*" + globals[i].help + "*",
                        inline: false
                    })
                }
                array.sort(function(a, b) { // Sort help list by command name alphabetically
                    let nameA = a.name.toUpperCase()
                    let nameB = b.name.toUpperCase()
                    if (nameA < nameB) {
                        return -1
                    }
                    if (nameA > nameB) {
                        return 1
                    }
                    return 0
                })
                let embeds = { // Add them to Discord's embed structure
                    title: "Momiji Help",
                    color: 0x64B5F6,
                    fields: array,
                    footer: {
                        icon_url: bot.user.avatarURL,
                        text: `Momiji ${version.version} (${version.codename}) by Prixyn & Drew`
                    }
                }
                bot.getDMChannel(msg.author.id).then(dm => {
                    dm.createMessage({
                        embed: embeds
                    }).catch((e) => {
                        if (typeof e == "object") {
                            e = JSON.stringify(e)
                        }
                        console.log(`${errors} ${e} - Help List Error bot.js:240`)
                        return msg.channel.createMessage("Sorry, I've hit an error sending you the help list. I've logged this and the developers will be notified. If this is continues to happen, please notify us in the official support guild.")
                    })
                }).then(() => {
                    msg.channel.createMessage("DM Sent with my commands! (Make sure you have DMs enabled!)")
                })
            }
        }
    })
    if (/<@!?343958214146261003>/.test(msg.content)) {
        bot.db.db('momiji').table('guilds').get(msg.channel.guild.id).run().then(guild => {
            guild.prefix = guild.prefix.split(' ').join("_")
            return msg.channel.createMessage(`My prefix is \`${guild.prefix}\` for this server.\n(Underscores are spaces)`)
        })
    }

    bot.db.db('momiji').table('settings').get(bot.user.id).run().then((settings) => {
        bot.person.get(msg.author.id).then((user) => {
            if (user.exp == user.maximum_exp || user.exp > user.maximum_exp) {
                user.maximum_exp = user.maximum_exp + 150
                user.level = user.level + 1
                bot.db.db('momiji').table('users').get(msg.author.id).update(user).run()
                msg.channel.createMessage("Congratuations, 🎉 <@" + msg.author.id + '>🎉 !  You have leveled up to **' + user.level + '**!')
            }
            else {
                if (settings.leveling_array.indexOf(msg.author.id) == 0) {
                    settings.leveling_array.push(msg.author.id)
                    var maximum = 25
                    var minimum = 5
                    var maximum2 = 10
                    var minimum2 = 0
                    var random_num2 = Math.floor(Math.random() * (maximum2 - minimum2 + 1)) + minimum2
                    var random_num = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
                    user.exp = user.exp + random_num
                    user.credits = user.credits + random_num2
                    bot.db.db('momiji').table('users').get(msg.author.id).update(user).run()
                    bot.db.db('momiji').table('settings').get(bot.user.id).update(settings).run()
                    setTimeout(() => {
                        var index = settings.leveling_array.indexOf(msg.author.id)
                        settings.leveling_array.splice(index, 1)
                        bot.db.db('momiji').table('settings').get(bot.user.id).update(settings).run()
                    }, 120000)
                }
            }
        })
    })
})

bot.on('guildCreate', guild => {
    bot.db.db('momiji').table('guilds').get(guild.id).run().then((res) => {
        if (!res) {
            bot.db.db('momiji').table('guilds').insert({
                id: guild.id,
                vip_level: 0,
                queue: {
                    link: [],
                    info: []
                },
                prefix: "momiji ",
                blacklist: false
            }).run()
            console.log(`${log} Added new guild.`)
        }
    }).then(() => {
        guild.defaultChannel.createMessage(":wave: Thanks for inviting me! You can check my prefix for this server by just mentioning me. Try the help command to see what I can do! I'll also need a role with permissions to let me do stuff! (I don't generate one to allow you to give me what you like.)")
    })
    bot.db.db('momiji').table('settings').get(bot.user.id).run().then((res) => {
        if (!res) { // meme?
            bot.db.db('momiji').table('settings').insert({
                id: bot.user.id,
                leveling_array: []
            }).run()
        }
    })
    bot.createMessage("341443592088322058", `I was added to ${guild.name} (${guild.id}). I am now in ${bot.guilds.size} servers.`)
})

bot.on('guildDelete', guild => {
    bot.db.db('momiji').table('guilds').get(guild.id).delete().run().then(() => {
        console.log(`${log} Removed a guild from my database.`)
        bot.createMessage("341443592088322058", `I was removed from ${guild.name} (${guild.id}). I am now in ${bot.guilds.size} servers.`)
    })
})

bot.on("guildMemberAdd", (guild, member) => {
    bot.db.db('momiji').table('users').get(member.id).run().then(res => {
        if (!res) {
            bot.db.db('momiji').table('users').insert({
                id: member.id,
                level: 0,
                exp: 0,
                credits: 0,
                maximum_exp: 50,
                blacklist: false
            }).run()
            console.log(`${log} Added new user.`)
        }
    })
})

bot.on('error', err => {
    if (typeof err == "object") {
        err = JSON.stringify(err)
    }
    if (err.length < 1800) {
        bot.createMessage("341443592088322058", `[ERROR]\n\`\`\`json\n${err}\`\`\``)
        console.log(`${errors} ${err}`)
    }
    else {
        bot.createMessage("341443592088322058", "Error too big, See console for details.")
        console.log(`${errors} ${err}`)
    }
})

bot.on('warn', err => {
    if (typeof err == "object") {
        err = JSON.stringify(err)
    }
    if (err.length < 1800) {
        bot.createMessage("341443592088322058", `[WARN]\n\`\`\`json\n${err}\`\`\``)
        console.log(`${errors} ${err}`)
    }
    else {
        bot.createMessage("341443592088322058", "Error too big, See console for details.")
        console.log(`${errors} ${err}`)
    }
})

process.on("unhandledRejection", err => {
    if (err.msg === "None of the pools have an opened connection and failed to open a new one") {
        return console.log(`${errors} ${JSON.stringify(err)}`)
    }
    if (typeof err == "object") {
        err = JSON.stringify(err)
    }
    if (err == "{}") {
        return
    }
    if (err.length < 1800) {
        bot.createMessage("341443592088322058", `[ERROR] Unhandled Promise Rejection\n\`\`\`json\n${err}\`\`\``)
        console.log(`${errors} ${err}`)
    }
    else {
        bot.createMessage("341443592088322058", "Error too big, See console for details.")
        console.log(`${errors} ${err}`)
    }
})

process.on("uncaughtException", err => {
    if (typeof err == "object") {
        err = JSON.stringify(err)
    }
    if (err.length < 1800) {
        bot.createMessage("341443592088322058", `[ERROR] Uncaught Exception\n\`\`\`json\n${err}\`\`\``)
        console.log(`${errors} ${err}`)
    }
    else {
        bot.createMessage("341443592088322058", "Error too big, See console for details.")
        console.log(`${errors} ${err}`)
    }
})

bot.connect()

function MSMS(millis) {
    var minutes = Math.floor(millis / 60000)
    var seconds = ((millis % 60000) / 1000).toFixed()
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds
}

function getTimeoutLength(to) {
    var second = 1000
    var start = new Date(to._idleStart),
        end = new Date(to._idleTimeout)
    return (end.getTime() - start.getTime()) / 1000
}

function clearTable(db, table, bot, opts) {
    var options = {
        force: opts.force || false
    }
    if (options.force == false) {
        try {
            bot.db.db(db).tableDrop(table).run().then(() => {
                bot.db.db(db).tableCreate(table).run()
            }).catch((e) => {
                //table might not exist
                bot.db.db(db).tableCreate(table).run()
            })
        }
        catch (e) {
            //table might not exist
            bot.db.db(db).tableCreate(table).run()
        }

        if (table == 'users') {
            db = null
            // Precautionary measures: remove all users from levels array.
            bot.db.db('momiji').table('settings').get(bot.user.id).run().then((settings) => {
                settings.leveling_array = []
                bot.db.db('momiji').table('settings').get(bot.user.id).update(settings).run()
            }).catch(e => {
                console.log(`${errors} ${e} - clearTable function error - bot.js:442`)
            })
        }
        return
    }
    else {
        try {
            bot.db.db(db).tableDrop(table).run().then(() => {
                bot.db.db(db).tableCreate(table).run()
            }).catch((e) => {
                //table might not exist
                bot.db.db(db).tableCreate(table).run()
            })
        }
        catch (e) {
            //table might not exist
            bot.db.db(db).tableCreate(table).run()
        }
    }
}
