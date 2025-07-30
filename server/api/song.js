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
    const {password} = await isPermission(ctx);
    if(!password) body.is_show = 1;

    const sort = body.sort || {order_num: 1}
    delete body.sort;

    let fields = body.fields?.split(',');
    const index = fields?.indexOf('is_lyrics');
    if(index > -1) {
        fields.splice(index,1,'IF(LENGTH(lyrics)>0,1,0) is_lyrics')
    }

    const rows = await Song.list(body,fields,sort);
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

cls.prototype.detail = async function (ctx) {
    const {query} = ctx.request;
    const {password} = await isPermission(ctx);
    if(!password) query.is_show = 1;

    const record = await Song.findOne(query);
    return Song.toFront(record);
}
cls.prototype.detail.settings = {
    params: {
        is_filter: true,
        body: {
            "type": "object",
            "properties": Object.assign({
                "id": verifyFormat.minString,
                "fields": {"type": "string"}
            }),
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
        await Song.updateOrder(category, order_num, true, manager);

        const back = await Song.save(body,manager);

        await Category.findOne({name: category}).catch(async err => {
            if(err.ok == Status.no_records_found.ok) {
                const category_count = await Category.count({},manager);
                await Category.save({name: category, order_num: category_count+1}, manager);
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
                "order_num": verifyFormat.positiveInt,
                "score": {"type": "string"},
                "score_num": verifyFormat.positiveInt,
                "lyrics": {"type": "string"}
            },"required":["name","category","order_num"]
        }
    }
};

cls.prototype.edit = async function (ctx) {
    await isPermission(ctx);

    let {body} = ctx.request;
    if(body.score) body.score = File.toDbPath(body.score);
    const {id,name,score} = body;
    delete body.order_num;

    const record = await Song.findOne({id});

    return Song.connector.transaction(async manager => {
        if(record.score && name && name != record.name) {
            const {path} = await File.updatePath(record.score, {
                category: "score",
                name: name || record.name,
                id
            }, manager);
            body.score = path;
        }

        if(score && score != record.score) {
            if(record.score) await File.deleteByPath(record.score);
            await File.updateByPath(score,{is_used: 1}, manager);
        }
        
        await Song.update({id},Object.assign({
            updated_at: Date.now()
        },body),manager);

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

cls.prototype.editOrdernums = async function (ctx) {
    await isPermission(ctx);
    
    const {ids,order_nums} = ctx.request.body;
    return  Song.connector.transaction(async manager => {
        let count = 0;
        for (var i = 0; i < ids.length; i++) {
            count += await Song.update({id: ids[i]},{order_num: order_nums[i]}, manager);
        }
        return count;
    });
}
cls.prototype.editOrdernums.settings = {
    params: {
        is_filter: true,
        body: {
            "type": "object",
            "properties": {
                "ids": {
                    "type": "array",
                    "items": verifyFormat.minString
                },
                "order_nums": {
                    "type": "array",
                    "items": verifyFormat.positiveInt
                }
            },"required":["ids","order_nums"]
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