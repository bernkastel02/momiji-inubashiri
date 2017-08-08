"use strict"
const r = require("rethinkdbdash")({
    silent: true
})

class Person {
    constructor() {}

    get(user_id) {
        return new Promise((resolve, reject) => {
            var resa = {};
            r.db('momiji').table('users').get(user_id).run().then((res) => {
                if (!res) {
                    resa.message = "User not found in database."
                    reject(resa)
                }
                else {
                    resa = res;
                    resolve(res)
                }

            })
        })
    }
}

module.exports = Person;
