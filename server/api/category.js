'use strict';

const Song = require('../domain/Song');
const Category = require('../domain/Category');
const File = require('../domain/File');
const { ENV: {FILE_SEVER} } = require('../etc/config');
const Base = require('./base');

class cls extends Base{
    constructor () {
        super();
    }
}

const instance = new cls();
const {verifyFormat, isPermission} = instance;

cls.prototype.list = async function (ctx) {
    const {body} = ctx.request;

    const sort = body.sort || {order_num: 1};
    const rows = await Category.list(body,null,sort);
    return {
        total_count: rows.length, 
        rows: rows
    };
};
cls.prototype.list.settings = {
    params: {
        is_filter: true,
        body: {
            "type": "object",
            "properties": Object.assign({
                "id": verifyFormat.minString,
                "name": {"type": "string"},
                "keyword": {"type": "string"},
                "is_show": {"enum": [0,1]},
                "fields": {"type": "string"},
                "sort": {"type": "object"}
            },verifyFormat.page),
            "required":[]
        }
    }
};

cls.prototype.create = async function (ctx) {
    await isPermission(ctx);

    const {body} = ctx.request;
    if(body.score) body.score = body.score.replace(FILE_SEVER,'');
    const {order_num} = body;
    await Category.isReferred({name: body.name});

    return Category.connector.transaction(async manager => {
        await Category.updateOrder(order_num, true, manager);
        return Category.save(body,manager);
    });
};
cls.prototype.create.settings = {
    params: {
        is_filter: true,
        body: {
            "type": "object",
            "properties": {
                "name": verifyFormat.minString,
                "is_show": {"enum": [0,1]},
                "order_num": {"type": "integer"},
            },"required":["name","order_num"]
        }
    }
};

cls.prototype.edit = async function (ctx) {
    await isPermission(ctx);

    const {body} = ctx.request;
    const {id,order_num} = body;
    const record = await Product.findOne({id});

    return Category.connector.transaction(async manager => {
        if(order_num && order_num != record.order_num) await Category.updateOrder(order_num, true, manager);

        await Category.update({id},Object.assign({
            updated_at: Date.now()
        },body),manager);

        return body;
    });
};
cls.prototype.edit.settings = {
    params: {
        is_filter: true,
        body: {
            "type": "object",
            "properties": Object.assign({
                "id": verifyFormat.minString
            }, cls.prototype.create.settings.params.body.properties),
            "required":["id"]
        }
    }
};

cls.prototype.delete = async function (ctx) {
    await isPermission(ctx);

    const {id} = ctx.request.query;
    const records = await Category.list({id},'id,name');
    const ids = records.map(x => x.id);
    const songs = await Song.list({category: records.map(x => x.name)}, 'id,score');

    return Category.connector.transaction(async manager => {
        await Song.delete({id: songs.map(x=>x.id)}, manager);
        await File.deleteByPath(songs.map(x=>x.score), manager);
        await Promise.all(records.map(async record => {
            return await Category.updateOrder(record.order_num, false, manager);
        }));
        return Category.delete({id: ids}, manager);
    });
};
cls.prototype.delete.settings = {
    params: {
        is_filter: true,
        query: {
            "type": "object",
            "properties": {
                "id": verifyFormat.minString
            },
            "required":["id"]
        }
    }
};

module.exports = instance;