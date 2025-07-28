'use strict';

const Base = require('./Base');
const {utils} = require('koa2frame');
const {Like, MoreThanOrEqual} = require('typeorm');
const {ENV: {FILE_SEVER}} = require('../etc/config');

class Song extends Base {
    constructor() {
        super('Song');
    }

    toCondition (params) {
        for(let [key,val] of Object.entries(params)) {
            if(!utils.isValue(val)) {
                delete params[key];
                continue;
            }
            switch(key) {
                case 'keyword':
                    if(val) {
                        const likes = {
                            name: Like(`%${val}%`),
                            category: Like(`%${val}%`)
                        };
                        params.$andOrs = params.$andOrs || [];
                        params.$andOrs.push([likes]);
                    }
                    delete params[key];
                    break;
            }
        }

        return super.toCondition(params);
    }

    toModel (opts) {
        const now = Date.now();
        opts.id = opts.id || utils.getID();
        opts.created_at = opts.created_at || now;
        opts.updated_at = opts.updated_at || now;
        if(![0,1].includes(opts.is_show)) opts.is_show = 1;
        if(opts.score) opts.score = opts.score.replace(FILE_SEVER,'');
        return super.toModel(opts);
    }

    toFront (record) {
        if(record.score) record.score = FILE_SEVER + record.score;
        return record;
    }

    async updateOrder (category, order_num, is_add, manager) {
        if(!order_num) return Promise.resolve();
        return super.update({
            category,
            order_num: MoreThanOrEqual(order_num)
        }, {
            order_num: () => `order_num${is_add?'+1':'-1'}`,
        } , manager);
    }
}

module.exports = new Song();