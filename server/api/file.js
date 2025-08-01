'use strict';

const File = require('../domain/File');
const Path = require('path');
const Fs = require('fs');
const { FILE_TYPE } = require('../etc/config');
const Base = require('./base');

class cls extends Base{
    constructor () {
        super();
    }
}

const instance = new cls();
const {verifyFormat, isPermission} = instance;

cls.prototype.list = async function (ctx) {
    await isPermission(ctx);

    const {body} = ctx.request;
    let fields = body.fields || 'id,name,category,path';
    if(fields.includes('path')) fields += ',extend';
    delete body.fields
    
    const sort = body.sort || {'created_at': -1};
    delete body.sort;

    const back = await File.findByPage(body,fields,sort);
    back.rows = back.rows.map(row => File.toFront(row));
    return back;
};
cls.prototype.list.settings = {
    params: {
        is_filter: true,
        body: {
            "type": "object",
            "properties": Object.assign({
                "id": verifyFormat.minString,
                "name": {"type": "string"},
                "is_extend": {"enum": [0,1,2]}, // O:extend=0; 1:all; 2:extend!=0
                "path": {"type": "string"},
                "keyword": {"type": "string"},
                "category": {"type": "string"},
                "is_used": {"enum": [0,1]},
                "fields": {"type": "string"},
                "sort": {"type": "object"}
            },verifyFormat.page),
            "required":[]
        }
    }
};

cls.prototype.upload = async function (ctx) {
    const {id: user_id, account} = await isPermission(ctx);

    let {files, category, name, id, extend} = ctx.request.body;
    extend = Number(extend) || 0;
    if(files.constructor == Object) files = [files];
    if(id) {
        files = files.slice(0,1);
        if(!extend) await File.isReferred({id});
    }

    const saves = files.map(({file:{path,type,size,name:file_name}}) => {
        const {ext,name: f_name} = Path.parse(file_name);
        const model = File.toModel({
            id,
            name: name || f_name,
            extend,
            ext,
            size,
            type,
            category,
            creator_id: user_id,
            creator_name: account
        })
        const file_path = File.toFilePath(model.path, extend);
        File.mkdirs(Path.dirname(file_path));
        Fs.copyFileSync(path, file_path);
        return model;
    });

    const records = await File.save(saves);
    const back = records.map(x=>File.toFront(x));
    return back.length == 1 ? back[0] : back;
}
cls.prototype.upload.settings = {
    params: {
        is_filter: true,
        body: {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "category": {
                    "enum": Object.values(FILE_TYPE)
                },
                "extend": verifyFormat.integer_format,
                "files": {
                    "type": "object",
                    "properties": {
                        "file": {
                            "oneOf":[
                                verifyFormat.files.properties.file,
                                {
                                    "type": "array",
                                    "items": verifyFormat.files.properties.file
                                }
                            ]
                        }
                    }
                }
            },"required":["files","category"]
        }
    }
};

cls.prototype.update = async function (ctx) {
    await isPermission(ctx);

    const {path, files:{file}} = ctx.request.body;
    const origin_db_path = File.toDbPath(path);
    await File.findOne({path: origin_db_path});

    const origin_file_path = File.toFilePath(origin_db_path);
    const {type, size, name:file_name, path:temp_path} = file;
    const ext = Path.extname(file_name);
    const target_db_path = origin_db_path.slice(0,origin_db_path.lastIndexOf('.')) + ext;
    const target_file_path = File.toFilePath(target_db_path);
    const {path: new_path} = await File.updateByPath(origin_db_path, {type,size,ext,path: target_db_path});
    if(Fs.existsSync(origin_file_path)) Fs.unlinkSync(origin_file_path);
    Fs.copyFileSync(temp_path, target_file_path);
    return File.toFront({path: new_path});
};
cls.prototype.update.settins = {
    params: {
        is_filter: true, 
        body: {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "files": {
                    "type": "object",
                    "properties": {
                        "file": verifyFormat.files.properties.file
                    }
                }
            },
            "required":["path","files"]
        }
    }
};

cls.prototype.delete = async function (ctx) {
    await isPermission(ctx);
    
    const {id} = ctx.request.query;
    const condition = {is_used: 0};
    if(id != 'all') condition.id = id;
    const records = await File.list(condition,'id,path');
    const paths = records.map(x=>x.path);
    
    await File.connector.transaction(async manager => {
        return File.deleteByPath(paths, manager);
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