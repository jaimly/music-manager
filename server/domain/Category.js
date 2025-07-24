'use strict';

const Base = require('./Base');
const {utils} = require('koa2frame');
const {Like, MoreThanOrEqual} = require('typeorm');

class Category extends Base {
    constructor() {
        super('Category');
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
                        params.name = Like(`%${val}%`)
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
        return super.toModel(opts);
    }

    async updateOrder (order_num, is_add, manager) {
        if(!order_num) return Promise.resolve();
        return super.update({
            order_num: MoreThanOrEqual(order_num)
        }, {
            order_num: () => `order_num${is_add?'+1':'-1'}`,
        } , manager);
    }
}

module.exports = new Category();