const r = require("rethinkdbdash")({
    servers: [{
        host: "178.32.232.165",
        port: 28017
    }],
    silent: true
})


r.dbCreate('momiji').run()
console.log("Main DB Created")
r.dbCreate('youtube').run()
console.log("Youtube DB Created");
setTimeout(() => {
    r.db('momiji').tableCreate('users').run()
    r.db('momiji').tableCreate('guilds').run()
    r.db('momiji').tableCreate('settings').run()
    r.db('youtube').tableCreate('channels').run()
    r.db('youtube').tableCreate('videos').run()
    console.log("DB Tables created!")
}, 2000);
