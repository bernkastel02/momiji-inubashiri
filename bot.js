"use strict"
const Eris = require("eris")
const betaToken = "MzQzOTU4MjE0MTQ2MjYxMDAz.DGoCUw.EuHVup_aZ7a - XA58hl7AWLLEBhw"
const bot = new Eris("MzM5Mjg3MTg0MzgzNDEwMTc3.DFhxVQ.yX6QtdtbNVk7weVvZQooGhDEm0M", {
    disableEvents: {
        "TYPING_START": true
    }
})
const r = require("rethinkdbdash")({
    servers: [{
        host: "178.32.232.165",
        port: 28016
    }],
    silent: true
})
var ws = {}
ws.queue = {}
const chalk = require('chalk')
const errors = chalk.red("[ERROR]")
const ready = chalk.green("[READY]")
const log = chalk.yellow("[LOG]")
const masters = ["241445525574909953", "161014852368859137"]
const runtime = require('./runtime/runtime.js')
const globals = runtime.globalControl.Commands
const p = require("./Leveling.js")
const person = new p()
const version = require("./version.json")
bot.person = person
bot.version = version
var timeout = []
require("./init.js")
bot.on("ready", () => {
    console.log(`${ready} Eris Ready!`)
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
    bot.guilds.forEach(g => {
        if (bot.guilds.get(g.id).members.get(bot.user.id).voiceState.channelID) {
            let channel = bot.guilds.get(g.id).members.get(bot.user.id).voiceState.channelID
            bot.leaveVoiceChannel(channel)
            r.db('momiji').table('guilds').get(g.id).run().then(guild => {
                guild.queue.link = []
                guild.queue.info = []
                r.db('momiji').table('guilds').get(g.id).update(guild).run()
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

    r.db('momiji').table('users').get(msg.author.id).run().then((res) => {
        if (!res) {
            r.db('momiji').table('users').insert({
                id: msg.author.id,
                level: 0,
                exp: 0,
                credits: 0,
                maximum_exp: 50,
                blacklist: false
            }).run()
            console.log("Added new user.")
        }
    })
    r.db('momiji').table('settings').get(bot.user.id).run().then((res) => {
        if (!res) { // meme?
            r.db('momiji').table('settings').insert({
                id: bot.user.id,
                user_blacklist: [],
                guild_backlist: [],
                leveling_array: []
            }).run()
        }
    })
    r.db('momiji').table('guilds').get(msg.guild.id).run().then((res) => {
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
                    r.db('momiji').table('guilds').get(msg.channel.guild.id).run().then(guild => {
                        if (guild.blacklist == true) {
                            return
                        }
                    })
                    r.db('momiji').table('users').get(msg.author.id).run().then(user => {
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
                                var index = globals[cmd].cooldown_array.indexOf(msg.author.id)
                                globals[cmd].cooldown_array.splice(index, 1)
                            }, globals[cmd].cooldown_time)
                        }
                        console.log(`${log} ${msg.author.username}#${msg.author.discriminator} > ${msg.channel.guild.name} > Ran ${globals[cmd].name}`)
                        globals[cmd].fn(msg, suffix, bot)
                    }
                }
                catch (err) {
                    if (typeof err == "object") {
                        err = JSON.stringify(err)
                    }
                    msg.channel.createMessage("Command error. I stopped the command process and logged the error to the console.")
                    console.log(`${errors} ${err.stack}`)
                }
            }
            if (cmd == "help") {
                let array = []
                for (let i in globals) {
                    array.push({
                        name: globals[i].name,
                        value: "*" + globals[i].help + "*",
                        inline: false
                    })
                }
                let embed = {
                    title: "Momiji Help",
                    color: 0x64B5F6,
                    fields: array,
                    footer: {
                        icon_url: bot.user.avatarURL,
                        text: `Momiji ${version.version} (${version.codename}) by Prixyn & Drew`
                    }
                }
                array.sort()
                bot.getDMChannel(msg.author.id).then(dm => {
                    dm.createMessage({
                        embed: embed
                    })
                }).then(() => {
                    msg.channel.createMessage("DM Sent with my commands! (Make sure you have DMs enabled!)")
                })
            }
        }
    })
    if (/<@!?339287184383410177>/.test(msg.content)) {
        r.db('momiji').table('guilds').get(msg.channel.guild.id).run().then(guild => {
            guild.prefix = guild.prefix.split(' ').join("_")
            return msg.channel.createMessage(`My prefix is \`${guild.prefix}\` for this server.\n(Underscores are spaces)`)
        })
    }

    r.db('momiji').table('settings').get(bot.user.id).run().then((settings) => {
        bot.person.get(msg.author.id).then((user) => {
            if (user.exp == user.maximum_exp || user.exp > user.maximum_exp) {
                user.maximum_exp = user.maximum_exp + 150
                user.level = user.level + 1
                r.db('momiji').table('users').get(msg.author.id).update(user).run()
                msg.channel.createMessage("Congratuations, 🎉 <@" + msg.author.id + '>🎉 !  You have leveled up to **' + user.level + '**!')
            }
            else {
                if (settings.leveling_array.indexOf(msg.author.id) == 0) {
                    settings.leveling_array.push(msg.author.id)
                    var maximum = 25
                    var minimum = 5
                    var maximum2 = 10
                    var minimum2 = 0;
                    var random_num2 = Math.floor(Math.random() * (maximum2 - minimum2 + 1)) + minimum2;
                    var random_num = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
                    user.exp = user.exp + random_num
                    user.credits = user.credits + random_num2;
                    r.db('momiji').table('users').get(msg.author.id).update(user).run()
                    r.db('momiji').table('settings').get(bot.user.id).update(settings).run();
                    setTimeout(() => {
                        var index = settings.leveling_array.indexOf(msg.author.id);
                        settings.leveling_array.splice(index, 1);
                        r.db('momiji').table('settings').get(bot.user.id).update(settings).run();
                    }, 120000)
                }
            }
        })
    })
})

bot.on('guildCreate', guild => {
    r.db('momiji').table('guilds').get(guild.id).run().then((res) => {
        if (!res) {
            r.db('momiji').table('guilds').insert({
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
    bot.createMessage("341443592088322058", `I was added to ${guild.name} (${guild.id}). I am now in ${bot.guilds.size} servers.`)
})

bot.on('guildDelete', guild => {
    r.db('momiji').table('guilds').get(guild.id).delete().run().then(() => {
        console.log(`${log} Removed a guild from my database.`)
        bot.createMessage("341443592088322058", `I was removed from ${guild.name} (${guild.id}). I am now in ${bot.guilds.size} servers.`)
    })
})

bot.on('error', err => {
    console.log(`${errors} ${err}`)
})

bot.on('warn', err => {
    console.log(`${errors} ${err}`)
})

process.on("unhandledRejection", err => {
    console.log(`${errors} ${err}`)
})

process.on("uncaughtException", err => {
    console.log(`${errors} ${err}`)
})

bot.connect()

function MSMS(millis) {
    var minutes = Math.floor(millis / 60000)
    var seconds = ((millis % 60000) / 1000).toFixed()
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds
}

function getTimeoutLength(to) {
    var second = 1000;
    var start = new Date(to._idleStart),
        end = new Date(to._idleTimeout)
    return (end.getTime() - start.getTime()) / 1000
}
