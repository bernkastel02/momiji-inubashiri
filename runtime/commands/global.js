"use strict"
const Commands = []
const download = require('download-file')
const fs = require("fs")
const request = require("request")
const fileExtension = require('file-extension')
const chalk = require('chalk')
const errors = chalk.red("[ERROR]")
const log = chalk.yellow("[LOG]")
var npmPackage = require('npm-package-info')
const betaToken = "MzQzOTU4MjE0MTQ2MjYxMDAz.DGoCUw.EuHVup_aZ7a - XA58hl7AWLLEBhw"
const stableToken = "MzM5Mjg3MTg0MzgzNDEwMTc3.DFhxVQ.yX6QtdtbNVk7weVvZQooGhDEm0M"
var current = betaToken
var r
var fixedSites = require(__dirname + "/fixedSites.json")
const Kaori = require('kaori');
const kaori = new Kaori(fixedSites);

// Port Handlers
if (current == stableToken) {
    r = require("rethinkdbdash")({
        servers: [{
            host: "178.32.232.165",
            port: 28016
        }],
        silent: true
    })
}
else if (current == betaToken) {
    r = require("rethinkdbdash")({
        servers: [{
            host: "178.32.232.165",
            port: 28017
        }],
        silent: true
    })
}


const masters = ["241445525574909953", "161014852368859137"]
const util = require('util')
const exec = require('child_process').exec
const GoogleImages = require('google-images')
const client = new GoogleImages('012792715071022562229:h3se1bgx4qq', 'AIzaSyAzV7chuCd919B1oZeOh4kynrbiaJBHj7k')
const ytdl = require('ytdl-core')
const stream = require('youtube-audio-stream')
const decoder = require('lame').Decoder
var GitHubApi = require("github")
var github = new GitHubApi()
// const Speaker = require("speaker")
var music = false
var musicD = {}

// WS
var ws = {}
ws.queue = {}
ws.request = (options, bodyNeed) => { // HTTP Requesting. My way!
    return new Promise((resolve, reject) => {
        request({
            method: options.method || "GET",
            uri: options.uri || null,
            header: options.headers || {},
            body: options.body || {},
            json: options.json || true
        }, (error, response, body) => {
            if (error) {
                reject(error)
            }
            else {
                if (bodyNeed == true) {
                    resolve(body)
                }
                else {
                    resolve(response)
                }
            }
        })
    })
}
ws.encodeImage = (file, filename) => {
    return new Promise((resolve, reject) => {
        var accepted_types = ["png", "jpg", "jpeg", "gif"]
        accepted_types.forEach((f) => {
            console.log("type: " + f)
            if (file.startsWith("http")) { // assume its a url.
                ws.download(file, filename).then((r) => {
                    if (f == fileExtension(filename)) {
                        // begin encode..for url
                        let b64 = "data:" + fileExtension(filename) + ";base64," + fs.readFileSync(filename, "base64")
                        resolve(b64)
                    }
                })
            }
            else {
                if (f == fileExtension(file)) {
                    console.log("file: " + file)
                    // begin encode
                    let b64 = "data:" + fileExtension(file) + ";base64," + fs.readFileSync(file, "base64")
                    resolve(b64)
                }
            }
        })
    })
}
ws.encode = (string) => {
    return new Promise((resolve, reject) => {
        let b64 = new Buffer(string, "utf8").toString('base64')
        let res = {
            message: b64
        }
        if (res.message == "") {
            res.message = "Undefined base64 string."
            reject(res)
        }
        else {
            resolve(res)
        }
    })
}
ws.decode = (base64) => {
    return new Promise((resolve, reject) => {
        let b64 = new Buffer(base64, "base64").toString("utf8")
        let res = {
            message: b64
        }
        if (res.message == "") {
            res.message = "Undefined base64 string."
            reject(res)
        }
        else {
            resolve(res)
        }
    })
}
ws.download = (url, filename) => {
    return new Promise((resolve, reject) => {
        download(url, {
            directory: "./",
            filename: filename || "file"
        }, () => {
            resolve(0)
        })
    })
}

// Music
let nextSong = async(guild_id, msg) => {
    await r.db('momiji').table('guilds').get(guild_id).run().then(guild => {
        if (guild.queue.link.length > 1) {
            guild.queue.link.shift()
            guild.queue.info.shift()
            r.db('momiji').table('guilds').get(guild_id).update(guild).run()
        }
    }).catch(e => {
        if (typeof e == "object") {
            e = JSON.stringify(e)
        }
        console.log(`${errors} ${e.stack}`)
    })
    await r.db('momiji').table('guilds').get(guild_id).run().then(guild => {
        // playSong(msg.channel.guild.id)
        return msg.channel.createMessage("Now playing " + guild.queue.info[0])
    })
}
let requestSong = async(suffix, guild_id, msg) => {
    r.db('momiji').table('guilds').get(guild_id).run().then(guild => {
        if (guild.queue.link.length == 20) {
            return msg.channel.createMessage("You've hit the limit of songs you can queue.")
        }
        if (ytdl.validateId(suffix) == true) {
            ytdl.getInfo(suffix, (err, info) => {
                if (err) {
                    return msg.channel.createMessage("Error fetching video, this could be because of copyright.")
                }
                else if (info.length_seconds >= 600) {
                    return msg.channel.createMessage("Song too long.")
                }
                else {
                    if (music == true) {
                        setTimeout(() => {
                            music = false
                            musicD.voice.voice.stopPlaying()
                            nextSong(guild_id, msg)
                        }, 3000)
                    }
                    guild.queue.link.push(suffix)
                    guild.queue.info.push("**[" + info.author.name + "]** - " + info.title)
                    r.db('momiji').table('guilds').get(guild_id).update(guild).run()
                    return msg.channel.createMessage("Added **[" + info.author.name + "]** - " + info.title + " to the queue.")
                }
            })
        }
        else {
            msg.channel.createMessage("Could not fetch video.")
        }
    })
}





// Commands 
Commands.eval = {
    name: "eval",
    help: "Evaluates code in JavaScript - Bot Devs Only",
    cooldown_array: [],
    cooldown_time: 0,
    fn: function(msg, suffix, bot) {
        if (masters.indexOf(msg.author.id) > -1) {
            msg.guild = msg.channel.guild
            if (!suffix) {
                return msg.channel.createMessage("Enter something to evaluate.")
            }
            try {
                suffix = eval(suffix)
                suffix = util.inspect(suffix, {
                    depth: 1
                })
                suffix = suffix.replace(new RegExp(bot.token, "gi"), "My token is not for your eyes!")
                if (suffix.length > 1800) {
                    suffix = suffix.substr(0, 1800)
                    suffix = suffix + "..."
                }
                msg.channel.createMessage(`\`\`\`js\n${suffix}\`\`\``)
            }
            catch (e) {
                msg.channel.createMessage(`\`\`\`js\n${e}\`\`\``)
            }
        }
        else {
            msg.channel.createMessage("You do not have enough magical power to execute this command! (No permission)")
        }
    }
}

Commands.ping = {
    name: "ping",
    help: "I'll show the bot's latency.",
    cooldown_array: [],
    cooldown_time: 0,
    fn: function(msg) {
        msg.channel.createMessage(`Pong! \`${msg.channel.guild.shard.latency}ms\``)
    }
}

Commands.awoo = {
    name: "awoo",
    help: "Awoooooooooooooooo!",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
            return msg.channel.createMessage("I need the permission to embed links.")
        }
        client.search('momiji inubashiri awoo').then((res) => {
            var leng = res.length - 1
            var random = Math.floor(Math.random() * (leng - 1 + 1)) + 1
            msg.channel.createMessage({
                embed: {
                    color: 0xEEEEEE,
                    title: "awoo",
                    image: {
                        url: res[random].url,
                        width: res[random].width,
                        height: res[random].height
                    },
                    footer: {
                        icon_url: bot.user.avatarURL,
                        text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                    }
                }
            })
        })
    }
}

Commands.life = {
    name: "life",
    help: "life.",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
            return msg.channel.createMessage("I need the permission to embed links.")
        }
        client.search('meme about life').then((res) => {
            var leng = res.length - 1
            var random = Math.floor(Math.random() * (leng - 1 + 1)) + 1
            msg.channel.createMessage({
                embed: {
                    color: 0x7986CB,
                    title: "life sucks",
                    image: {
                        url: res[random].url,
                        width: res[random].width,
                        height: res[random].height
                    },
                    footer: {
                        icon_url: bot.user.avatarURL,
                        text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                    }
                }
            })
        })
    }
}
Commands.porn = {
    name: "pon",
    help: "uguuu",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        msg.channel.createMessage({
            embed: {
                image: {
                    url: "https://cdn.discordapp.com/attachments/226210345222537216/346072011732418571/momiblush.png"
                },
                footer: {
                    icon_url: bot.user.avatarURL,
                    text: "< what are you, some fucking degenerate?"
                }

            }
        })
    }
}

Commands.thinking = {
    name: "thinking",
    help: "🤔",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
            return msg.channel.createMessage("I need the permission to embed links.")
        }
        client.search('thinking emote meme').then((res) => {
            var leng = res.length - 1
            var random = Math.floor(Math.random() * (leng - 1 + 1)) + 1
            msg.channel.createMessage({
                embed: {
                    color: 0xFFD54F,
                    title: "🤔",
                    image: {
                        url: res[random].url,
                        width: res[random].width,
                        height: res[random].height
                    },
                    footer: {
                        icon_url: "https://cdn.discordapp.com/emojis/293808597522055168.png",
                        text: `🤔 ${bot.version.version} (🤔) by THINKxyn & THINK`
                    }
                }
            })
        })
    }
}
Commands.thonkang = {
    name: "thonkang",
    help: "🤔",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
            return msg.channel.createMessage("I need the permission to embed links.")
        }
        client.search('thonkang emote meme').then((res) => {
            var leng = res.length - 1
            var random = Math.floor(Math.random() * (leng - 1 + 1)) + 1
            msg.channel.createMessage({
                embed: {
                    color: 0xFFD54F,
                    title: "🤔",
                    image: {
                        url: res[random].url,
                        width: res[random].width,
                        height: res[random].height
                    },
                    footer: {
                        icon_url: "https://cdn.discordapp.com/emojis/293808597522055168.png",
                        text: `🤔 ${bot.version.version} (🤔) by THONKxyn & THONK`
                    }
                }
            })
        })
    }
}

Commands.image = {
    name: "image",
    help: "Search for an image.",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
            return msg.channel.createMessage("I need the permission to embed links.")
        }
        client.search(suffix).then((res) => {
            var random = Math.floor(Math.random() * (res.length - 1 + 1)) + 1
            if (suffix.includes("porn") || suffix.includes("hentai")) {
                msg.channel.createMessage("That word is globally blacklisted, <@" + msg.author.id + ">!")
                return
            }
            msg.channel.createMessage({
                embed: {
                    color: 0x90CAF9,
                    title: "Image Search for " + suffix,
                    image: {
                        url: res[random].url,
                        width: res[random].width,
                        height: res[random].height
                    },
                    footer: {
                        icon_url: bot.user.avatarURL,
                        text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                    }
                }
            })
        })
    }
}

Commands.exec = {
    name: "exec",
    help: "I'll execute a command in console. - Bot Devs Only.",
    cooldown_array: [],
    cooldown_time: 0,
    fn: function(msg, suffix, bot) {
        if (masters.indexOf(msg.author.id) > -1) {
            exec(suffix, (err, stdout, stderr) => {
                if (stdout && stdout.length > 1800) {
                    stdout = stdout.subtr(0, 1800)
                    stdout = stdout + "..."
                    return msg.channel.createMessage(`\`\`\`cmd\n${stdout}\`\`\``)
                }
                if (stdout && stdout.length < 1800) {
                    return msg.channel.createMessage(`\`\`\`cmd\n${stdout}\`\`\``)
                }
                if (err) {
                    if (err.length > 1800) {
                        err = err.substr(0, 1800)
                        err = err + "..."
                    }
                    return msg.channel.createMessage(`\`\`\`cmd\n${err}\`\`\``)
                }
                if (stderr) {
                    if (stderr.length > 1800) {
                        stderr = stderr.substr(0, 1800)
                        stderr = stderr + "..."
                    }
                    return msg.channel.createMessage(`\`\`\`cmd\n${stderr}\`\`\``)
                }
            })
        }
        else {
            msg.channel.createMessage("You do not have enough magical power to execute this command! (No permission)")
        }
    }
}

Commands.list = {
    name: "list",
    help: "soon:tm:",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg) {
        msg.channel.createMessage("Work in progress.")
    }
}

Commands.setprefix = {
    name: "setprefix",
    help: "Changes the prefix for the server.",
    cooldown_array: [],
    cooldown_time: 30,
    fn: function(msg, suffix) {
        r.db('momiji').table('guilds').get(msg.channel.guild.id).run().then(guild => {
            if (!suffix) {
                return msg.channel.createMessage("Please enter a prefix to set.")
            }
            else if (suffix.length > 10) {
                return msg.channel.createMessage("Suffix too long, try one less than or equal to 10 characters long.")
            }
            else if (suffix == guild.prefix) {
                return msg.channel.createMessage("This is already the set prefix!")
            }
            else {
                guild.prefix = suffix.split("_").join(" ")
                r.db('momiji').table('guilds').get(msg.channel.guild.id).update(guild).run().then(() => {
                    return msg.channel.createMessage("Prefix set to `" + suffix + "` for this server.")
                }).catch(e => {
                    if (typeof e == "object") {
                        e = JSON.stringify(e)
                    }
                    console.log(`${errors} ${e}`)
                    return msg.channel.createMessage("Error changing prefix, this error message appears when the database cannot update the prefix. Please try again, and if the problem persists, contact us.")
                })
            }
        }).catch(e => {
            if (typeof e == "object") {
                e = JSON.stringify(e)
            }
            console.log(`${errors} ${e.stack}`)
            return msg.channel.createMessage("Error changing prefix, this is most likely on our end. Please contact us if the problem persists.")
        })
    }
}

Commands.changeavatar = {
    name: "changeavatar",
    help: "Changes the bot's avatar. - Bot Devs Only",
    cooldown_array: [],
    cooldown_time: 0,
    fn: function(msg, suffix, bot) {
        let expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
        let regex = new RegExp(expression)
        if (masters.indexOf(msg.author.id) > -1) {
            if (!suffix) {
                return msg.channel.createMessage("I need something to set the avatar to!")
            }
            if (suffix.match(regex)) {
                ws.download(suffix, "avatar.jpg").then(() => {
                    ws.encodeImage("./avatar.jpg", "avatar.jpg").then((string) => {
                        msg.channel.createMessage("I'll try to set the avatar!")
                        bot.editSelf({
                            avatar: string
                        }).catch(e => {
                            if (typeof e == "object") {
                                e = JSON.stringify(e)
                            }
                            msg.channel.createMessage("Failed to set avatar, most likely hit ratelimit.")
                            console.log(`${errors} ${e.stack}`)
                        })
                    }).catch(e => {
                        if (typeof e == "object") {
                            e = JSON.stringify(e)
                        }
                        msg.channel.createMessage("Error caught, aborted process.")
                        console.log(`${errors} ${e.stack}`)
                    })
                }).catch(e => {
                    if (typeof e == "object") {
                        e = JSON.stringify(e)
                    }
                    msg.channel.createMessage("Error caught, aborted process.")
                    console.log(`${errors} ${e.stack}`)
                })
            }
            if (!suffix.match(regex)) {
                msg.channel.createMessage("I need a link to an image to set the avatar to.")
            }
        }
        else {
            msg.channel.createMessage("You don't have enough magical power to execute this. (No permission)")
        }
    }
}

Commands.profile = {
    name: "profile",
    help: "Displays your profile (Work in Progress)",
    cooldown_array: [],
    cooldown_time: 20000,
    fn: function(msg, suffix, bot) {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
            return msg.channel.createMessage("I need the permission to embed links.")
        }
        bot.person.get(msg.author.id).then((user) => {
            msg.channel.createMessage({
                embed: {
                    title: `Profile for ${msg.author.username}`,
                    color: 0x64B5F6,
                    description: `Level: *${user.level}*\nEXP : *${user.exp}* / *${user.maximum_exp}* *(Current / Max)*\nCredits: *${user.credits}*`,
                    thumbnail: {
                        url: msg.author.avatarURL
                    },
                    footer: {
                        icon_url: bot.user.avatarURL,
                        text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                    }
                }
            })
        })
    }
}

Commands.blacklist = {
    name: "blacklist",
    help: "Blacklists a user or guild - Bot Devs Only",
    cooldown_array: [],
    cooldown_time: 0,
    fn: function(msg, suffix) {
        if (masters.indexOf(msg.author.id) > -1) {
            if (!suffix) {
                return msg.channel.createMessage("You need to enter parameters for this command.")
            }
            suffix = suffix.split(' ')
            if (suffix[0] == "guild") {
                if (isNaN(suffix[1])) {
                    msg.channel.createMessage("Please enter an ID of the guild to blacklist.")
                }
                else {
                    r.db('momiji').table('guilds').get(suffix[1]).run().then(guild => {
                        guild.blacklist = true
                        r.db('momiji').table('guilds').get(suffix[1]).update(guild).run()
                        msg.channel.createMessage("Guild blacklisted.")
                    }).catch(() => {
                        msg.channel.createMessage("Error blacklisting guild. Make sure it's the right ID.")
                    })
                }
            }
            else if (suffix[0] == "user") {
                if (isNaN(suffix[1])) {
                    msg.channel.createMessage("Please enter an ID of the user to blacklist.")
                }
                else {
                    r.db('momiji').table('users').get(suffix[1]).run().then(user => {
                        user.blacklist = true
                        r.db('momiji').table('users').get(suffix[1]).update(user).run()
                        msg.channel.createMessage("User blacklisted.")
                    }).catch(() => {
                        msg.channel.createMessage("Error blacklisting user, make sure it's the right ID.")
                    })
                }
            }
            else {
                msg.channel.createMessage("Your first input needs to be either guild or user.")
            }
        }
        else {
            msg.channel.createMessage("You don't have enough magical power to execute this. (No permission)")
        }
    }
}

Commands.unblacklist = {
    name: "unblacklist",
    help: "Unblacklist a user or guild - Bot Devs only.",
    cooldown_array: [],
    cooldown_time: 0,
    fn: function(msg, suffix) {
        if (masters.indexOf(msg.author.id) > -1) {
            if (!suffix) {
                return msg.channel.createMessage("You need to enter parameters for this command.")
            }
            suffix = suffix.split(' ')
            if (suffix[0] == "guild") {
                if (isNaN(suffix[1])) {
                    msg.channel.createMessage("Please enter an ID of the guild to unblacklist.")
                }
                else {
                    r.db('momiji').table('guilds').get(suffix[1]).run().then(guild => {
                        if (guild.blacklist == false) {
                            return msg.channel.createMessage("Guild isn't blacklisted.")
                        }
                        guild.blacklist = false
                        r.db('momiji').table('guilds').get(suffix[1]).update(guild).run()
                        msg.channel.createMessage("Guild unblacklisted.")
                    }).catch(() => {
                        msg.channel.createMessage("Error unblacklisting guild. Make sure it's the right ID.")
                    })
                }
            }
            else if (suffix[0] == "user") {
                if (isNaN(suffix[1])) {
                    msg.channel.createMessage("Please enter an ID of the user to unblacklist.")
                }
                else {
                    r.db('momiji').table('users').get(suffix[1]).run().then(user => {
                        if (user.blacklist == false) {
                            return msg.channel.createMessage("")
                        }
                        user.blacklist = false
                        r.db('momiji').table('users').get(suffix[1]).update(user).run()
                        msg.channel.createMessage("User unblacklisted.")
                    }).catch(() => {
                        msg.channel.createMessage("Error unblacklisting user, make sure it's the right ID.")
                    })
                }
            }
            else {
                msg.channel.createMessage("Your first input needs to be either guild or user.")
            }
        }
        else {
            msg.channel.createMessage("You don't have enough magical power to execute this. (No permission)")
        }
    }
}

/*
Commands.music = {
    name: "music",
    help: "music [join | queue(or request) <item> | kill | volume <1 - 100> | resume | pause]",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        musicD.bot = bot
        suffix = suffix.split(" ")
        if (!suffix) {
            msg.channel.createMessage("You need to enter a subcommand! (Displayed in the help message)")
        }
        else {
            if (suffix[0] == "join") {
                new Promise((resolve, reject) => {
                    if (suffix[1]) {
                        join(msg.guild.id, msg.author.id, bot, msg, suffix).then(yes => {
                            resolve(yes.message)
                        })
                    }
                    else {
                        resolve(join(msg.guild.id, msg.author.id, bot, msg, suffix).then(voice => {
                            if (!musicD.voice) {
                                setTimeout(() => {
                                    waitMusic("waitMusic.mp3")
                                }, 1000)
                            }
                            musicD.voice = voice
                            musicD.guildID = msg.guild.id
                            musicD.msg = msg
                            musicD.suffix = suffix
                        })).catch((r) => {
                            reject(r.message)
                        })
                    }
                })
            }
            if (suffix[0] == "playlist") {
                if (!suffix[1]) {
                    playlist(msg.channel.guild.id, msg)
                }
                if (suffix[1] == "clear") {
                    r.db('momiji').table('guilds').get(msg.channel.guild.id).run().then(guild => {
                        guild.queue.link = []
                        guild.queue.info = []
                        r.db('momiji').table('guilds').get(msg.channel.guild.id).update(guild).run()
                        msg.channel.createMessage("Playlist cleared.")
                    }).catch(e => {
                        if (typeof e == "object") {
                            e = JSON.stringify(e)
                        }
                        console.log(`${errors} ${e}`)
                        msg.channel.createMessage("Error, couldn't clear playlist. This is most likely because of a database failure.")
                    })
                }
            }
            else if (musicD.voice) {
                if (suffix[0] == "queue" || suffix[0] == "request") {
                    requestSong(suffix[1], msg.channel.guild.id, msg)
                }
                if (suffix[0] == "volume") {
                    setVolume(suffix[1])
                }
                if (suffix[0] == "pause") {
                    pause()
                }
                if (suffix[0] == "play") {
                    resume()
                }
                if (suffix[0] == "kill") {
                    leave(msg.channel.guild.id, bot, msg)
                }
            }
        }
    }
}
*/

Commands.youtube = {
    name: "youtube",
    help: "WIP. No description!",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        r.db('youtube').table('channels').get(msg.author.id).run().then((channel) => {
            r.db('youtube').table('videos').get(msg.author.id).run().then((video) => {
                suffix = suffix.split(" ")
                var beta_testers = ["150745989836308480"]
                if (beta_testers.indexOf(msg.author.id) > -1 || masters.indexOf(msg.author.id) > -1) {
                    if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
                        return msg.channel.createMessage("I need the permission to embed links.")
                    }
                    if (suffix[0] == "channel") {
                        if (suffix[1] == "create") {
                            if (!channel) {
                                var channelname = msg.author.username.split(" ").join("_")
                                r.db('youtube').table('channels').get(msg.author.id).run().then(channels => {
                                    if (!channels) {
                                        r.db('youtube').table('channels').insert({
                                            id: msg.author.id,
                                            channel_id: makeID(24),
                                            channel_name: channelname,
                                            subscribers: 0,
                                            videos: [],
                                            like_total: 0,
                                            dislike_total: 0,
                                            views: 0,
                                            join_date: new Date(),
                                            likers: [],
                                            dislikers: [],
                                            avatar: "https://www.youtube.com/yts/img/avatar_720-vflYJnzBZ.png",
                                            terminated: 0
                                        }).run()
                                    }
                                })
                                msg.channel.createMessage("Success! Your channel has been created!")
                            }
                            else {
                                msg.channel.createMessage("You already have a channel, you can't do this!")
                            }
                        }
                        else if (suffix[1] == "setavatar") {
                            r.db('youtube').table('channels').get(msg.author.id).run().then(channels => {
                                if (channels) {
                                    channels.avatar = suffix[2]
                                    console.log(channels.avatar)
                                    r.db('youtube').table('channels').get(msg.author.id).update(channels).run().then((res) => {
                                        console.log(res)
                                        msg.channel.createMessage("Success! We've updated your avatar. Please wait a moment before checking, this may have small lag.")
                                    })

                                }
                                else {
                                    msg.channel.createMessage("You don't have a channel, create one with the creation command!")
                                }
                            })
                        }
                        else {
                            msg.channel.createMessage("There are sub-commands for channel! They are:\n`create` `setavatar`")
                        }
                    }
                    else if (suffix[0] == "video") {
                        if (suffix[1] == "create") {

                        }
                        else {
                            msg.channel.createMessage("There are sub-commands for video! They are:\n`create`")
                        }
                    }
                    else if (suffix[0] == "profile") {
                        if (!channel) {
                            msg.channel.createMessage("You don't have a channel, create one with the creation command!")
                        }
                        else {
                            var vids = channel.videos

                            if (channel.videos.length == 0) {
                                vids = "No videos!"
                            }
                            else {
                                var video_join
                                channel.videos.forEach((vids) => {
                                    video_join.push({ name: vids.name, description: vids.description, views: vids.views, likes: vids.likes, dislikes: vids.dislikes })
                                    vids = video_join
                                })
                            }
                            msg.channel.createMessage({
                                embed: {
                                    title: `Youtuber: ${channel.channel_name} (${msg.author.id})`,
                                    color: 0xef5350,
                                    fields: [{
                                        name: "Stats",
                                        value: `Subscribers: ${channel.subscribers}\nTotal Views: ${channel.views}\nVideos: ${vids}`,
                                        inline: true
                                    }],
                                    thumbnail: {
                                        url: channel.avatar
                                    },
                                    footer: {
                                        icon_url: bot.user.avatarURL,
                                        text: `Youtube Simulator | ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                                    }
                                }
                            })
                        }
                    }
                    else {
                        msg.channel.createMessage("Sorry, that's not one of the sub-commands. Refer to the help message of this command to see all of the sub-commands.")
                    }
                }

                else {
                    msg.channel.createMessage("You are not one of the beta testers for this command!")
                }
            })
        })
    }
}

Commands.invite = {
    name: "invite",
    help: "I'll send an invite link so you can add me to your server.",
    cooldown_array: [],
    cooldown_time: 30000,
    fn: function(msg, suffix, bot) {
        msg.channel.createMessage("Here you go!\n<https://discordapp.com/oauth2/authorize?client_id=" + bot.user.id + "&scope=bot&permissions=0>")
    }
}

Commands.osu = {
    name: "osu",
    help: "<mode [osu | taiko | ctb | mania]> <username>",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: (msg, suffix, bot) => {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
            return msg.channel.createMessage("I need the permission to embed links.")
        }
        suffix = suffix.split(' ')
        if (!suffix[0]) {
            return msg.channel.createMessage("No mode found!")
        }
        else if (suffix[2]) {
            msg.channel.createMessage("Try replacing your space(s) with a `_`. Don't make the same mistake Prixyn did.")
        }
        else {
            if (!suffix[1]) {
                msg.channel.createMessage("No username found!")
            }
            else {
                var base = (mode, username) => {
                    let BASE_URL = `https://lemmmy.pw/osusig/sig.php?colour=hexff66aa&uname=${username}&mode=${mode}&flagshadow&flagstroke&rankedscore&onlineindicator=undefined&xpbar&xpbarhex`
                    BASE_URL = BASE_URL.split("_").join("%20")
                    return BASE_URL
                }
                if (suffix[0] == "osu") {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xff66aa,
                            image: {
                                url: base(0, suffix[1])
                            },
                            footer: {
                                icon_url: bot.user.avatarURL,
                                text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                            }
                        }
                    })
                }
                else if (suffix[0] == "taiko") {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xff66aa,
                            image: {
                                url: base(1, suffix[1])
                            },
                            footer: {
                                icon_url: bot.user.avatarURL,
                                text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                            }
                        }
                    })
                }
                else if (suffix[0] == "ctb") {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xff66aa,
                            image: {
                                url: base(2, suffix[1])
                            },
                            footer: {
                                icon_url: bot.user.avatarURL,
                                text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                            }
                        }
                    })
                }
                else if (suffix[0] == "mania") {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xff66aa,
                            image: {
                                url: base(3, suffix[1])
                            },
                            footer: {
                                icon_url: bot.user.avatarURL,
                                text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                            }
                        }
                    })
                }
                else {
                    msg.channel.createMessage("No mode found!")
                }
            }
        }
    }
}

Commands.throwupd = {
    name: "throwupd",
    help: "Throws an update changelog into the updates channel. - Bot Devs Only",
    cooldown_array: [],
    cooldown_time: 0,
    fn: function(msg, suffix, bot) {
        request({
            uri: "https://hastebin.com/documents/" + suffix
        }, (error, res, body) => {
            body = JSON.parse(body)
            if (masters.indexOf(msg.author.id) > -1) {
                suffix = suffix.split(' ')
                bot.createMessage("216780389627199488", {
                    embed: {
                        title: "Update Log for " + new Date(),
                        color: 0xFFCA28,
                        description: `\`\`\`diff\n${body.data}\n\`\`\``
                    }
                })
            }
            else {
                msg.channel.createMessage("You don't have enough magical power to execute this. (No permission)")
            }
        })
    }
}

Commands.github = {
    name: "github",
    help: "Grabs a user, organization, or repository over github.",
    cooldown_array: [],
    cooldown_time: 0,
    fn: (msg, suffix, bot) => {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
            return msg.channel.createMessage("I need the permission to embed links.")
        }
        suffix = suffix.split(" ")
        if (!suffix[0]) {
            msg.channel.createMessage("You need to enter a sub-command of `user` `repo` or `org`")
        }
        else {
            if (suffix[0] == "user") {
                github.users.getForUser({
                    username: suffix[1]
                }, function(err, res) {
                    if (err) {
                        msg.channel.createMessage("Unable to find github user!")
                        return
                    }
                    res = JSON.parse(JSON.stringify(res.data))
                    msg.channel.createMessage({
                        embed: {
                            title: "Github User for " + suffix[1],
                            color: 0xFFF176,
                            url: res.html_url,
                            fields: [{
                                name: "Stats",
                                value: `Repositories: ${res.public_repos}\nGists: ${res.public_gists}\nFollowers: ${res.followers}`,
                                inline: true
                            }, {
                                name: "Information",
                                value: `Biography: ${res.bio}\n\nLocation: ${res.location}\nCompany: ${res.company}\nReal Name (or Name): ${res.name}`
                            }],
                            thumbnail: {
                                url: res.avatar_url
                            },
                            footer: {
                                icon_url: bot.user.avatarURL,
                                text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                            }
                        }
                    })
                })
            }
            else if (suffix[0] == 'repo') {
                var repo = suffix[1].split("/")
                github.repos.get({
                    owner: repo[0],
                    repo: repo[1]
                }, function(err, res) {
                    if (err) {
                        msg.channel.createMessage("Unable to find github repo! (:user/:repo)")
                        return
                    }
                    res = JSON.parse(JSON.stringify(res.data))
                    msg.channel.createMessage({
                        embed: {
                            title: "Github Repo for " + suffix[1],
                            color: 0xFFF176,
                            url: res.html_url,
                            fields: [{
                                name: "Stats",
                                value: `Stars: ${res.stargazers_count}\nWatchers: ${res.watchers_count}\nIssues: ${res.open_issues_count}`,
                                inline: true
                            }, {
                                name: "Information",
                                value: `Description: ${res.description}\n\nMain Language: ${res.language}\nLicense: [${res.license.name}](${res.license.url})\nDefault Branch: ${res.default_branch}`
                            }],
                            thumbnail: {
                                url: res.owner.avatar_url
                            },
                            footer: {
                                icon_url: bot.user.avatarURL,
                                text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                            }
                        }
                    })
                })
            }
            else if (suffix[0] == "org") {
                github.orgs.get({
                    org: suffix[1]
                }, function(err, res) {
                    if (err) {
                        msg.channel.createMessage("Unable to find github organization!")
                        return
                    }
                    res = res.data
                    msg.channel.createMessage({
                        embed: {
                            title: "Github Organization for " + suffix[1],
                            color: 0xFFF176,
                            url: res.html_url,
                            fields: [{
                                name: "Stats",
                                value: `Repositories: ${res.public_repos}\nGists: ${res.public_gists}\nFollowers: ${res.followers}`,
                                inline: true
                            }, {
                                name: "Information",
                                value: `Description: ${res.description}\n\nLocation: ${res.location}\nName: ${res.name}`
                            }],
                            thumbnail: {
                                url: res.avatar_url
                            },
                            footer: {
                                icon_url: bot.user.avatarURL,
                                text: `Momiji ${bot.version.version} (${bot.version.codename}) by Prixyn & Drew`
                            }
                        }
                    })
                })
            }
        }
    }
}

Commands.npm = {
    name: "npm",
    help: "Grabs an npm module.",
    cooldown_array: [],
    cooldown_time: 0,
    fn: (msg, suffix, bot) => {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("embedLinks"))) {
            return msg.channel.createMessage("I need the permission to embed links.")
        }
        npmPackage(suffix, (err, pkg) => {
            if (err) {
                msg.channel.createMessage("NPM Package not found.")
                return
            }
            console.log(pkg["dist-tags"])
            msg.channel.createMessage({
                embed: {
                    title: "NPM Package Info for " + pkg.name + `()`,
                    thumbnail: {
                        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Npm-logo.svg/1000px-Npm-logo.svg.png"
                    }
                }
            })
        })
    }
}

Commands.kick = {
    name: "kick",
    help: "Kicks a member, or members, from the server.",
    cooldown_array: [],
    cooldown_time: 0,
    fn: function(msg, suffix, bot) {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("kickMembers"))) {
            return msg.channel.createMessage("I need the permission to kick users.")
        }
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("kickMembers"))) {
            return msg.channel.createMessage("You don't have the permission to kick users.")
        }
        if (!suffix) {
            return msg.channel.createMessage("To kick someone, I need one of these: A mention, name#discriminator, or ID.")
        }
        if (!msg.mentions[0]) {
            if (isNaN(suffix)) {
                try {
                    msg.channel.guild.members.forEach(m => {
                        if ((m.user.username + "#" + m.user.discriminator) == suffix) {
                            msg.channel.guild.kickMember(m.id, `Kick initiated by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`).catch(e => {
                                msg.channel.createMessage("Failed to kick, this is most likely due to the bot being lower in hierarchy than the person being kicked.")
                            })
                            return msg.channel.createMessage("Attempting to kick user.")
                        }
                    })
                }
                catch (e) {
                    return msg.channel.createMessage("You didn't mention, provide a user ID, or post the username#discriminator of the person to kick.")
                }
            }
            else {
                if (!msg.channel.guild.members.get(suffix)) {
                    return msg.channel.createMessage("That ID isn't a user in this server.")
                }
                else {
                    let userDiscrim = msg.channel.guild.members.get(suffix).username + "#" + msg.channel.guild.members.get(suffix).discriminator
                    msg.channel.guild.kickMember(suffix, `Kick initiated by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`).catch(e => {
                        msg.channel.createMessage("Failed to kick, this is most likely due to the bot being lower in hierarchy than the person being kicked.")
                    })
                    return msg.channel.createMessage(`Attempting to kick ${userDiscrim} from the server.`)
                }
            }
        }
        if (msg.mentions[0]) {
            if (msg.mentions.length > 1) {
                let array = []
                msg.mentions.forEach(m => {
                    array.push(m.username + "#" + m.discriminator + "(" + m.id + ")")
                    msg.channel.guild.kickMember(m.id, `Kick initiated by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`).catch(e => {
                        msg.channel.createMessage("Failed to kick, this is most likely due to the bot being lower in hierarchy than the people being kicked.")

                    })
                })
                msg.channel.createMessage(`Attempting to kick ${array.join(', ')} from the server.`)
            }
            else if (msg.mentions.length == 1) {
                msg.channel.guild.kickMember(msg.mentions[0].id, `Kick initiated by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`).catch(e => {
                    msg.channel.createMessage("Failed to kick, this is most likely due to the bot being lower in hierarchy than the person being kicked.")
                }).then(() => {
                    msg.channel.createMessage(`Attempting to kick ${msg.mentions[0].username}#${msg.mentions[0].discriminator} from the server.`)
                })
            }
        }
    }
}

Commands.ban = {
    name: "ban",
    help: "Bans a user, or users, from the server.",
    cooldown_array: [],
    cooldown_time: 0,
    fn: function(msg, suffix, bot) {
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("banMembers"))) {
            return msg.channel.createMessage("I need the permission to ban users.")
        }
        if (!(msg.channel.guild.members.get(bot.user.id).permission.has("banMembers"))) {
            return msg.channel.createMessage("You don't have the permission to ban users.")
        }
        if (!suffix) {
            return msg.channel.createMessage("To ban someone, I need one of these: A mention, name#discriminator, or ID.")
        }
        if (!msg.mentions[0]) {
            if (isNaN(suffix)) {
                try {
                    msg.channel.guild.members.forEach(m => {
                        if ((m.user.username + "#" + m.user.discriminator) == suffix) {
                            msg.channel.guild.banMember(m.id, 7, `Ban initiated by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`)
                            return msg.channel.createMessage("User banned.")
                        }
                    })
                }
                catch (e) {
                    return msg.channel.createMessage("You didn't mention, provide a user ID, or post the username#discriminator of the person to ban.")
                }
            }
            else {
                if (!msg.channel.guild.members.get(suffix)) {
                    return msg.channel.createMessage("That ID isn't a user in this server.")
                }
                else {
                    let userDiscrim = msg.channel.guild.members.get(suffix).username + "#" + msg.channel.guild.members.get(suffix).discriminator
                    msg.channel.guild.banMember(suffix, 7, `Ban initiated by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`)
                    return msg.channel.createMessage(`Banned ${userDiscrim} from the server.`)
                }
            }
        }
        if (msg.mentions[0]) {
            if (msg.mentions[1]) {
                let array = []
                msg.mentions.forEach(m => {
                    array.push(m.username + "#" + m.discriminator + "(" + m.id + ")")
                    msg.channel.guild.banMember(m.id, 7, `Ban initiated by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`)
                })
                msg.channel.createMessage(`Banned ${array.join(', ')} from the server.`)
            }
            else {
                msg.channel.guild.banMember(msg.mentions[0].id, 7, `Ban initiated by ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`)
                msg.channel.createMessage(`Banned ${msg.mentions[0].username}#${msg.mentions[0].discriminator} from the server.`)
            }
        }
    }
}
Commands.coin = {
    name: "coin",
    help: "Flip a coin! Get heads or tails.",
    cooldown_array: [],
    cooldown_time: 1000,
    fn: function(msg, suffix, bot) {
        var coin = Math.floor(Math.random() * 2) + 1
        var label = (coin == 1) ? 'heads' : 'tails'
        bot.createMessage(msg.channel.id, `<@${msg.author.id}> got the **${label}** side of the coin!`)
    }
}

Commands.gelbooru = {
    name: "gelbooru",
    help: "Search on gelbooru.",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        suffix = suffix.split(" ")
        if (msg.channel.name.startsWith("nsfw") || msg.channel.nsfw) {
            if (suffix.length > 6) {
                msg.channel.createMessage("You cannot use more than 6 tags for gelbooru!")
            }
            else {
                kaori.search("gb_fix", { tags: suffix, limit: 100 }).then(images => {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xe57373,
                            image: {
                                url: images[Math.floor(Math.random() * (100 - 0 + 1)) + 0].common.fileURL
                            },
                            footer: {
                                icon_url: "http://i0.kym-cdn.com/photos/images/facebook/001/134/994/4ff.jpg",
                                text: `...uh?`
                            }
                        }
                    })
                }).catch(e => {
                    msg.channel.createMessage("Unable to find anything with tags [" + suffix.join(", ") + "]")
                })
            }
        }
        else {
            if (suffix.indexOf("rating:safe") > -1) {
                kaori.search("gb_fix", { tags: suffix, limit: 100 }).then(images => {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xAED581,
                            image: {
                                url: images[Math.floor(Math.random() * (100 - 0 + 1)) + 0].common.fileURL
                            },
                            footer: {
                                icon_url: "http://i0.kym-cdn.com/photos/images/facebook/001/134/994/4ff.jpg",
                                text: `...uh?`
                            }
                        }
                    })
                }).catch(e => {
                    msg.channel.createMessage("Unable to find anything with tags [" + suffix.join(", ") + "]")
                })
            }
            else if (suffix.indexOf("inubashiri_momiji") > -1) {
                msg.channel.createMessage({
                    embed: {
                        color: 0xAED581,
                        image: {
                            url: "https://cdn.discordapp.com/attachments/216763379535052801/346476511936905237/unknown.png"
                        },
                        footer: {
                            icon_url: bot.user.avatarURL,
                            text: `< no awoo girl allowed`
                        }
                    }
                })
            }
            else if (suffix.indexOf("prixyn") > -1) {
                msg.channel.createMessage({
                    embed: {
                        color: 0xAED581,
                        image: {
                            url: "https://cdn.discordapp.com/attachments/339521908187856898/346477733670289409/unknown.png"
                        },
                        footer: {
                            icon_url: bot.user.avatarURL,
                            text: `< awoo~`
                        }
                    }
                })
            }
            else {
                msg.channel.createMessage("This command can only be used in an NSFW channel!")
            }
        }
    }
}
Commands.leetspeak = {
    name: "leetspeak",
    help: "Change something you say into l33t 5p34k",
    cooldown_array: [],
    cooldown_time: 1000,
    fn: function(msg, suffix) {
        if (!suffix) {
            return msg.channel.createMessage("Enter something for me to convert!")
        }
        suffix = suffix.toLowerCase()
            .replace(new RegExp('a', "g"), "4")
            .replace(new RegExp('e', "g"), "3")
            .replace(new RegExp('l', "g"), "|")
            .replace(new RegExp("o", "g"), "0") // Stopping here to prevent too much clusterfuck of conversion
            .replace(new RegExp("s", "g"), "5")
            .replace(new RegExp("t", "g"), "7")
            .replace(new RegExp("f", "g"), "(")
            .replace(new RegExp("z", "g"), "2")
            .replace(new RegExp("i", "g"), "1")
            .replace(new RegExp("b", "g"), "|3")
        msg.channel.createMessage(suffix)
    }
}
Commands.yandere = {
    name: "yandere",
    help: "Search on yande.re!",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        suffix = suffix.split(" ")
        if (msg.channel.name.startsWith("nsfw") || msg.channel.nsfw) {
            if (suffix.length > 6) {
                msg.channel.createMessage("You cannot use more than 6 tags for yande.re!")
            }
            else {
                kaori.search("yandere", { tags: suffix, limit: 100, random: true }).then(images => {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xe57373,
                            image: {
                                url: images[Math.floor(Math.random() * (100 - 0 + 1)) + 0].common.fileURL
                            },
                            footer: {
                                icon_url: "http://i0.kym-cdn.com/photos/images/facebook/001/134/994/4ff.jpg",
                                text: `...uh?`
                            }
                        }
                    })
                }).catch(e => {
                    msg.channel.createMessage("Unable to find anything with tags [" + suffix.join(", ") + "]")
                })
            }
        }
        else {
            if (suffix.indexOf("rating:safe") > -1) {
                kaori.search("yandere", { tags: suffix, limit: 100, random: true }).then(images => {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xAED581,
                            image: {
                                url: images[Math.floor(Math.random() * (100 - 0 + 1)) + 0].common.fileURL
                            },
                            footer: {
                                icon_url: "http://i0.kym-cdn.com/photos/images/facebook/001/134/994/4ff.jpg",
                                text: `...uh?`
                            }
                        }
                    })
                }).catch(e => {
                    msg.channel.createMessage("Unable to find anything with tags [" + suffix.join(", ") + "]")
                })
            }
            else if (suffix.indexOf("prixyn") > -1) {
                msg.channel.createMessage({
                    embed: {
                        color: 0xAED581,
                        image: {
                            url: "https://cdn.discordapp.com/attachments/339521908187856898/346477733670289409/unknown.png"
                        },
                        footer: {
                            icon_url: bot.user.avatarURL,
                            text: `< awoo~`
                        }
                    }
                })
            }
            else {
                msg.channel.createMessage("This command can only be used in an NSFW channel!")
            }
        }
    }
}
Commands.e621 = {
    name: "e621",
    help: "Search on e621!",
    cooldown_array: [],
    cooldown_time: 6000,
    fn: function(msg, suffix, bot) {
        suffix = suffix.split(" ")
        if (msg.channel.name.startsWith("nsfw") || msg.channel.nsfw) {
            if (suffix.length > 6) {
                msg.channel.createMessage("You cannot use more than 6 tags for e621!")
            }
            else {
                kaori.search("e621", { tags: suffix, limit: 100 }).then(images => {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xe57373,
                            image: {
                                url: images[Math.floor(Math.random() * (100 - 0 + 1)) + 0].common.fileURL
                            },
                            footer: {
                                icon_url: "http://i0.kym-cdn.com/photos/images/facebook/001/134/994/4ff.jpg",
                                text: `...uh?`
                            }
                        }
                    })
                }).catch(e => {
                    console.log(e)
                    msg.channel.createMessage("Unable to find anything with tags [" + suffix.join(", ") + "]")
                })
            }
        }
        else {
            if (suffix.indexOf("rating:safe") > -1) {
                kaori.search("e621", { tags: suffix, limit: 100 }).then(images => {
                    msg.channel.createMessage({
                        embed: {
                            color: 0xAED581,
                            image: {
                                url: images[Math.floor(Math.random() * (100 - 0 + 1)) + 0].common.fileURL
                            },
                            footer: {
                                icon_url: "http://i0.kym-cdn.com/photos/images/facebook/001/134/994/4ff.jpg",
                                text: `...uh?`
                            }
                        }
                    })
                }).catch(e => {
                    msg.channel.createMessage("Unable to find anything with tags [" + suffix.join(", ") + "]")

                })
            }
            else if (suffix.indexOf("prixyn") > -1) {
                msg.channel.createMessage({
                    embed: {
                        color: 0xAED581,
                        image: {
                            url: "https://cdn.discordapp.com/attachments/339521908187856898/346477733670289409/unknown.png"
                        },
                        footer: {
                            icon_url: bot.user.avatarURL,
                            text: `< awoo~`
                        }
                    }
                })
            }
            else {
                msg.channel.createMessage("This command can only be used in an NSFW channel!")
            }
        }
    }
}
Commands.purge = {
    name: "purge",
    help: "Remove messages up to 2 weeks old. (1-100)",
    cooldown_array: [],
    cooldown_time: 10000,
    fn: function(msg, suffix, bot) {
        if (!suffix) {
            return msg.channel.createMessage("Enter an amount of messages 1-100!")
        }
        if (!msg.channel.guild.members.get(bot.user.id).permission.has("manageMessages")) {
            return msg.channel.createMessage("I don't have permission to manage messages!")
        }
        if (!msg.channel.guild.members.get(msg.author.id).permission.has("manageMessages")) {
            return msg.channel.createMessage("You don't have permission to manage messages!")
        }
        if (isNaN(suffix)) {
            return msg.channel.createMessage("Please enter a number 1-100!")
        }
        if (suffix > 100) {
            return msg.channel.createMessage("Enter a number less than 100.")
        }
        if (suffix < 1) {
            return msg.channel.createMessage("Enter a number greater than 0.")
        }
        msg.channel.purge(suffix, null, msg.id).catch(e => {
            msg.channel.createMessage("Error deleting messages, most likely because you have just added me and the messages you want to remove are not in my cache, or the messages are older than 2 weeks.")
        }).then(() => {
            setTimeout(() => {
                msg.channel.createMessage(`Removed ${suffix} messages. - Initiated by ${msg.author.username}`)
            }, 1000)
        })
    }
}

/*if (musicD.voice) {
    // Outer emitters.
    musicD.voice.voice.on("end", () => {
        nextSong(musicD.voice.guildID, musicD.msg)
    })
    musicD.voice.voice.on("debug", info => {
        console.log(`${log} ${info}`)
    })
    musicD.voice.voice.on("error", e => {
        console.log(`${errors} ${e}`)
    })
}

if (musicD.voice && musicD.bot) {
    setInterval(() => {
        inactiveCheck(musicD.voice.voice.id, musicD.bot)
    }, 10000)
}
// 600000


function join(guild_id, requester_id, bot, msg, suffix) {
    return new Promise((resolve, reject) => {
        let channelToJoin = bot.guilds.get(guild_id).members.get(requester_id).voiceState.channelID

        if (channelToJoin == null && !suffix[1]) {
            return msg.channel.createMessage("You aren't in a voice channel and didn't supply the name of one for me to join.")
        }
        if (channelToJoin == null && suffix[1]) {
            channelToJoin = msg.channel.guild.channels.find(r => r.name == suffix[1]).id
            bot.joinVoiceChannel(channelToJoin).then((voice) => {
                msg.channel.createMessage("I'll join that voice channel!")
                resolve({
                    voice: voice
                })
            })
        }
        if (channelToJoin != null && suffix[1] && musicD.voice) {
            channelToJoin = msg.channel.guild.channels.find(r => r.name == suffix[1]).id
            musicD.voice.voice.switchChannel(channelToJoin)
            return msg.channel.createMessage("I'll move to that voice channel!")
        }
        else if (channelToJoin == bot.guilds.get(guild_id).members.get(bot.user.id).voiceState.channelID) {
            return msg.channel.createMessage("I am already in this voice channel!")
        }
        else {
            bot.joinVoiceChannel(channelToJoin).then(voice => {
                msg.channel.createMessage("I'll join your voice channel!")
                resolve({
                    voice: voice
                })
            })
        }
    })
}

function playlist(guild_id, msg) {
    r.db('momiji').table('guilds').get(guild_id).run().then(guild => {
        if (guild.queue.link.length >= 1) {
            msg.channel.createMessage(guild.queue.info.join('\n'))
        }
        else {
            msg.channel.createMessage("There is nothing in the playlist.")
        }
    }).catch(e => {
        if (typeof e == "object") {
            e = JSON.stringify(e)
        }
        console.log(`${errors} ${e.stack}`)
        msg.channel.createMessage("Error occured, this was reported to the bot devs.")
    })
}

function playSong(guild_id) {
    r.db('momiji').table('guilds').get(guild_id).run().then(guild => {
        let song = stream(guild.queue.link[0]).pipe(decoder()).pipe(speaker)
        musicD.voice.voice.play(song, { inlineVoice: true })

        // inactiveCheck(musicD.voice.guildID, musicD.bot)
    }).catch(e => {
        console.log(`${errors} ${e.stack}`)
    })
}

function inactiveCheck(guild_id, bot) {
    if (!(bot.guilds.get(guild_id).members.get(bot.user.id).voiceState.channelID)) {
        let voiceChannel = bot.guilds.get(guild_id).members.get(bot.user.id).voiceState.channelID
        if (bot.guilds.get(guild_id).channels.get(voiceChannel).voiceMembers.size == 1) {
            r.db('momiji').table('guilds').get(guild_id).run().then(guild => {
                guild.queue.link = []
                guild.queue.info = []
                r.db('momiji').table('guilds').get(guild_id).update(guild).run()
            }).catch(e => {
                if (typeof e == "object") {
                    e = JSON.stringify(e)
                }
                console.log(`${errors} ${e.stack}`)
            })
            bot.leaveVoiceChannel(voiceChannel)
            musicD.msg.channel.createMessage("I left the voice channel because no one was in it.")
        }
        r.db('momiji').table('guilds').get(guild_id).run().then(guild => {
            if (guild.queue.link.length == 0 && guild.queue.info.length == 0) {
                bot.leaveVoiceChannel(voiceChannel)
                musicD.msg.channel.createMessage("I left the voice channel because the queue was empty.")
            }
        }).catch(e => {
            if (typeof e == "object") {
                e = JSON.stringify(e)
            }
            console.log(`${errors} ${e.stack}`)
        })
    }
}

function setVolume(suffix) {
    if (isNaN(suffix)) {
        musicD.msg.channel.createMessage("Enter a number to set the volume to.")
    }
    else if (suffix > 100 || suffix < 1) {
        musicD.msg.channel.createMessage("Try a number 1-100.")
    }
    else {
        musicD.voice.voice.setVolume((suffix / 100))
        musicD.msg.channel.createMessage(`I changed the volume to \`${suffix}%\`.`)
    }

}

function waitMusic(song) {
    music = true
    musicD.voice.voice.play(song, { inlineVolume: true })
    setVolume(10)
}

function resume() {
    musicD.voice.voice.resume()
    musicD.msg.channel.createMessage("I'll continue playing for you.")
}

function pause() {
    musicD.voice.voice.pause()
    musicD.msg.channel.createMessage("I'll pause that for you. Be sure to resume soon, or I'll leave automatically.")
}

function leave(guild_id, bot, msg) {
    let voiceChannel = bot.guilds.get(guild_id).members.get(bot.user.id).voiceState.channelID
    r.db('momiji').table('guilds').get(guild_id).run().then(guild => {
        guild.queue.link = []
        guild.queue.info = []
        r.db('momiji').table('guilds').get(guild_id).update(guild).run()
    }).catch(e => {
        if (typeof e == "object") {
            e = JSON.stringify(e)
        }
        console.log(`${errors} ${e.stack}`)
    })
    bot.leaveVoiceChannel(voiceChannel)
    msg.channel.createMessage("I've cleared the queue and left the channel.")
}

var getAudio = function(req, res) {
    var requestUrl = 'http://youtube.com/watch?v=' + req.params.videoId
    try {
        stream(requestUrl).pipe(res)
    }
    catch (exception) {
        res.status(500).send(exception)
    }
} 
*/

function getLeaderboard() {
    return new Promise((resolve, reject) => {
        r.db('momiji').table('users').orderBy('exp').limit(10).run().then((ldrb) => {
            resolve(ldrb)
        }).catch(e => {
            reject(e.stack)
        })
    })
}

/* Major Database Functions */

function clearTable(db, table, bot, opts) {
    var options = {
        force: opts.force || false
    }
    if (options.force == false) {
        try {
            r.db(db).tableDrop(table).run().then(() => {
                r.db(db).tableCreate(table).run()
            }).catch((e) => {
                //table might not exist
                r.db(db).tableCreate(table).run()
            })
        }
        catch (e) {
            //table might not exist
            r.db(db).tableCreate(table).run()
        }

        if (table == 'users') {
            db = null
            // Precautionary measures: remove all users from levels array.
            r.db('momiji').table('settings').get(bot.user.id).run().then((settings) => {
                settings.leveling_array = []
                r.db('momiji').table('settings').get(bot.user.id).update(settings).run()
            })
        }
        return
    }
    else {
        try {
            r.db(db).tableDrop(table).run().then(() => {
                r.db(db).tableCreate(table).run()
            }).catch((e) => {
                //table might not exist
                r.db(db).tableCreate(table).run()
            })
        }
        catch (e) {
            //table might not exist
            r.db(db).tableCreate(table).run()
        }
    }
}

function resetLevels(bot) {
    r.db('momiji').table('settings').get(bot.user.id).run().then((settings) => {
        settings.leveling_array = []
        r.db('momiji').table('settings').get(bot.user.id).update(settings).run()
    })
}

function makeID(length) {
    var text = ""
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789!@#$%^&*()_<>.?"
    possible = possible.split("")
    for (var i = 0; i < length; i++)
        text += possible[Math.floor(Math.random() * possible.length)]

    return text
}

exports.Commands = Commands

/*
+eval msg.channel.createMessage({
    embed: {
        title: "Update for Bot",
        description: "List of updates for the bot! ",
        color: 0x90CAF9,
        fields: [{name: "commit-tag", value:"*commit-message* [[Commit]]()"}]
    }
})
*/
