'use strict';

const Base = require('./Base');

class Password extends Base {
    constructor() {
        super('Password');
    }

    async check(password) {
        return super.findOne({password})
    }
}

module.exports = new Password();