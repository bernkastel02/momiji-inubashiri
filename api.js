"use strict"
var express = require('express') // call express
var app = express() // define our app using express
var bodyParser = require('body-parser')
var version = require("./version.json")
const Eris = require("eris")
const bot = new Eris("MzM5Mjg3MTg0MzgzNDEwMTc3.DFhxVQ.yX6QtdtbNVk7weVvZQooGhDEm0M")
var r;
if (bot.user.username == "Momiji") {
    r = require("rethinkdbdash")({
        servers: [{
            host: "178.32.232.165",
            port: 28016
        }],
        silent: true
    })
}
else if (bot.user.username == "Momiji Beta") {
    r = require("rethinkdbdash")({
        servers: [{
            host: "178.32 .232 .165",
            port: 28017
        }],
        silent: true
    })
}

var npmPackage = require('npm-package-info')
bot.channels = []
bot.newguilds = []
var bood = []
setTimeout(() => {
    bot.guilds.forEach((g) => {
        bood[g.id] == g
        console.log("Checking: " + g.name)
        g.channels.forEach(c => {
            console.log("Pushed: " + c.name)
            bot.channels.push(c)
        })
    })
}, 2000)
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
var port = 8080


var router = express.Router()

router.get('/', function(req, res) {
    res.json({
        version: version.api_ver,
        developer: "Prixyn",
        endpoints: {
            guilds: "/guilds/:id",
            users: "/users/:id",
            pi: "/pi",
            stats: "/stats",
            anime: {
                lolis: {
                    lewd: "/anime/lolis?nsfw=true",
                    nolewd: "/anime/lolis"
                },
                version: "/anime/version",
                memes: "/anime/memes"
            },
            youtube: {
                channels: "/channeels/:id"
            }
        }
    })
})

router.get('/guilds/:id', function(req, res) {
    r.db('momiji').table('guilds').get(req.params.id).run().then((guild) => {
        if (!guild) {
            res.status(404).json(({
                message: "Guild not found",
                response: 404
            }))
        }
        else {
            var g = bot.guilds.get(guild.id)
            res.status(200).json(({
                guild: {
                    id: guild.id,
                    prefix: guild.prefix,
                    members: g.members.size,
                    queue: guild.queue,
                    vip: guild.vip_level,
                    isBlacklist: guild.blacklist
                }
            }))
        }
    })
})

router.get('/users/:id', function(req, res) {
    r.db('momiji').table('users').get(req.params.id).run().then((user) => {
        if (!user) {
            res.status(404).json(({
                message: "User not found",
                response: 404
            }))
        }
        else {

            res.status(200).json(({
                user: user
            }))
        }
    })
})

router.get('/pi', function(req, res) {
    res.status(200).json({
        javascript_pi: Math.PI,
        leibniz_pi: pi(1e+9)
    })
})

router.get('/stats', function(req, res) {
    setTimeout(() => {
        res.status(200).json({
            guilds: bot.guilds.size,
            users: bot.users.size,
            channels: bot.channels.length
        })
    }, 2000)
})

router.get('/anime/:ep', function(req, res) {
    if (req.params.ep == "memes") {
        var animeMemes = []
        var rand = Math.floor(Math.random() * (animeMemes.length - 1 - 0 + 1)) + 0
        res.json({
            version: version.anime_api,
            meme: animeMemes[rand] || null
        })
    }
    else if (req.params.ep == "lolis") {
        if (req.query.nsfw == 'true') {
            var nsfwLoli = [
                "http://img1.ak.crunchyroll.com/i/spire3/1a5818934a8bfc4f1e5379fdcb8ab3b91435616907_full.jpg"
            ]
            var rand3 = Math.floor(Math.random() * (nsfwLoli.length - 1 - 0 + 1)) + 0
            res.json({
                version: version.anime_api,
                loli: nsfwLoli[rand3]
            })
        }
        else if (req.query.nsfw == 'false' || !req.query.nsfw) {
            var loli = [
                "http://pm1.narvii.com/6030/756b6a254c86787a929b605aba68fe71ecfba92f_hq.jpg",
                "https://cdn.discordapp.com/attachments/110373943822540800/342181907120783371/FB_IMG_1500888726416.jpg"
            ]
            var rand2 = Math.floor(Math.random() * (loli.length - 1 - 0 + 1)) + 0
            console.log("loli: " +
                rand2)
            res.json({
                version: version.anime_api,
                loli: loli[rand2]
            })
        }
    }
    else if (req.params.ep == "version") {

        res.json({
            version: version.anime_api,
            developer: "Prixyn"
        })
    }
})

router.get('/youtube/channels/:channel', function(req, res) {
    r.db('youtube').table('channels').get(req.params.channel).run().then((channel) => {
        if (!channel) {
            res.status(404).json(({
                message: "Channel not found",
                response: 404
            }))
        }
        else {
            res.json({ channel: channel })
        }
    })
})
router.get('/npm/:package', function(req, res) {
    npmPackage(req.params.package, (err, pkg) => {
        if (err) {
            res.json({ msg: "NPM Package not found." })
            return;
        }
        res.json(pkg)
    });
})


app.use('/', router)
app.enable('trust proxy')

app.listen(port)
console.log('Magic happens on port ' + port)

function pi(n) {
    var v = 0
    for (var i = 1; i <= n; i += 4) { // increment by 4
        v += 1 / i - 1 / (i + 2) // add the value of the series
    }
    return 4 * v // apply the factor at last
}


bot.connect()
