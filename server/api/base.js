'use strict';

const {api: Base, error: Status} = require('koa2frame');
const Password = require('../domain/Password');

class cls extends Base{
    constructor () {
        super();
    }

    async isPermission(ctx) {
        const {password} = ctx.headers || {};
        if(password) {
            await Password.check(password).catch(err => {
                if(err.ok == Status.no_records_found.ok) {
                    return Promise.reject(Status.not_signed);
                }
            });
        }
        return ctx.jwt || {};
    }
}

module.exports = cls;