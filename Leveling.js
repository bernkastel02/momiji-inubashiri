"use strict"
const r = require("rethinkdbdash")({
    servers: [{
        host: "178.32.232.165",
        port: 28017
    }], // Beta Port, jesus fucking christ
    silent: true
})

class Person {
    constructor() {}

    get(user_id) {
        return new Promise((resolve, reject) => {
            let resa = {}
            r.db('momiji').table('users').get(user_id).run().then((res) => {
                if (!res) {
                    resa.message = "User not found in database. (Leveling.js Error)"
                    reject(resa)
                }
                else {
                    resa = res
                    resolve(res)
                }

            })
        })
    }
}

module.exports = Person;
