'use strict';

const {error: Status} = require('koa2frame');
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

    const sort = body.sort || {order_num: 1}
    const rows = await Song.list(body,null,sort);
    return {
        total_count: rows.length, 
        rows: rows.map(row => Song.toFront(row))
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
                "category": {"type": "string"},
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
    const {score, category, order_num} = body;


    return Song.connector.transaction(async manager => {
        await Song.updateOrder(order_num, true, manager);

        const back = await Song.save(body,manager);

        await Category.findOne({name: category}).catch(async err => {
            if(err.ok == Status.no_records_found.ok) {
                await Category.create({name: category}, manager);
            }
        })

        if(score) {
            await File.updateByPath(score,{is_used: 1}, manager);
        }

        return Song.toFront(back);
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
                "category": {"type": "string"},
                "order_num": {"type": "integer"},
                "score": {"type": "string"},
                "lyrics": {"type": "string"}
            },"required":["name","category","order_num"]
        }
    }
};

cls.prototype.edit = async function (ctx) {
    await isPermission(ctx);

    const {body} = ctx.request;
    if(body.score) body.score = File.toDbPath(body.score);
    const {id,score,order_num} = body;
    const record = await Song.findOne({id});

    return Song.connector.transaction(async manager => {
        if(order_num && order_num != record.order_num) await Song.updateOrder(order_num, true, manager);
        
        await Song.update({id},Object.assign({
            updated_at: Date.now()
        },body),manager);

        if(!record.score && score) {
            await File.updateByPath(score,{is_used: 1}, manager);
        }

        return Song.toFront(body);
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
    const records = await Song.list({id},'id,score');
    const ids = records.map(x=>x.id);
    const paths = records.map(x=>x.score);

    return Song.connector.transaction(async manager => {
        await File.deleteByPath(paths, manager);
        await Promise.all(records.map(async record => {
            return await Song.updateOrder(record.order_num, false, manager);
        }));
        return Song.delete({id: ids}, manager);
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