'use strict';

const Base = require('./Base');
const {utils} = require('koa2frame');
const {Like} = require('typeorm');
const Path = require('path');
const Fs = require('fs');
const Os = require('os');
const {ENV: {FILE_SEVER}} = require('../etc/config');

class File extends Base {
    constructor() {
        super('File');
    }

    toCondition (params) {
        params = Object.assign({},params);

        for(let [key,val] of Object.entries(params)) {
            switch(key) {
                case 'id':
                case 'category':
                    params[key] = val.constructor == String ? val.split(',') : val;
                    break;
                case 'keyword':
                    if(val) {
                        params.$andOrs = params.$andOrs || [];
                        params.$andOrs.push([{
                            name: Like(`%${val}%`),
                            ext: Like(`%${val}%`)
                        }]);
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
        opts.category = opts.category || 'product';
        opts.path = this.combileDbPath(opts);
        return super.toModel(opts);
    }

    toFront (record) {
        if(record.path) record.path = FILE_SEVER + record.path;
        return record;
    }

    toDbPath(str) {
        return str.replace(Os.homedir(),'').replace(FILE_SEVER,'');
    }

    toFilePath(str) {
        return Path.resolve('.') + '/res' + this.toDbPath(str);
    }

    combileDbPath({category,name,id,ext}) {
        return `/${category}/${name}_${id}${ext}`;
    }

    async getCategories () {
        const list = await this.list({groupBy:'category'},'category',{category:1});
        return list.map(x=>x.category);
    }
    
    async updateByPath(path, target, manager) {
        const origin_db_path = this.toDbPath(path);
        await this.update({path: origin_db_path}, target, manager);
        return {path: target.path};
    }

    async updatePath (path, {category, name, id}, manager) {
        const origin_file_path = this.toFilePath(path);
        const target_db_path = this.combileDbPath({
            category,
            name,
            id,
            ext: Path.extname(path)
        });
        const update_data = {
            id,
            name,
            path: target_db_path
        }
        await this.updateByPath(path, update_data, manager);

        const target_file_path = this.toFilePath(target_db_path);
        Fs.renameSync(origin_file_path, target_file_path);

        return {path: target_db_path};
    }

    async copy(path, manager) {
        if(!path) return;

        const record = await this.findOne({path});
        const new_id = utils.getID();
        const new_path = record.path ? record.path.replace(record.id,new_id) : '';

        Fs.copyFileSync(
            this.toFilePath(path), 
            this.toFilePath(new_path)
        );

        return this.save(Object.assign({}, record, {
            id: new_id,
            path: new_path,
            created_at: Date.now()
        }), manager);
    }

    async deleteByPath(path, manager) {
        if(!path) return;
        if(path.constructor == String) path = [path];

        path.map(p => {
            if(!p) return;
            p = this.toFilePath(p);
            if(Fs.existsSync(p)) Fs.unlinkSync(p);
        });

        return super.delete({path}, manager);
    }

    mkdirs (dirpath) {
        if(Fs.existsSync(dirpath)) return;
        if (!Fs.existsSync(Path.dirname(dirpath))) {
            this.mkdirs(Path.dirname(dirpath));
        }
        Fs.mkdirSync(dirpath);
    };
}

module.exports = new File();