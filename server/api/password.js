'use strict';

const Password = require('../domain/Password');
const Base = require('./base');

class cls extends Base{
    constructor () {
        super();
    }
}

const instance = new cls();
const {verifyFormat,isPermission} = instance;

cls.prototype.login = async function (ctx) {
    const {password} = ctx.request.body;
    return await Password.check(password);
};
cls.prototype.login.settings = {
    params: {
        is_filter: true,
        body: {
            "type": "object",
            "properties": {
                "password": verifyFormat.minString
            },
            "required":["password"]
        }
    }
};

cls.prototype.update = async function (ctx) {
    await isPermission(ctx);
    
    const {password} = ctx.request.query;
    return await Password.update({password});
};
cls.prototype.update.settings = {
    params: {
        is_filter: true,
        query: {
            "type": "object",
            "properties": {
                "password": verifyFormat.minString
            },
            "required":["password"]
        }
    }
}

module.exports = instance;