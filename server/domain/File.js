'use strict';

const Base = require('./Base');
const {utils} = require('koa2frame');
const {Like, Not} = require('typeorm');
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
                case 'path':
                    if(val?.constructor == String) {
                        const reg = /-[0-9]{1,2}\./g
                        const extend = val?.match(reg);
                        params[key] = this.toDbPath(val);
                        if(extend?.length) {
                            params.extend = Number(extend[0].slice(1, extend[0].length-1));
                        }
                    }
                    break;
                case 'is_extend':
                    switch(val) {
                        case 0:
                            params.extend = 0;
                            break;
                        case 2:
                            params.extend = Not(0);
                            break;
                    }
                    delete params[key];
                    break;
            }
        }

        return super.toCondition(params);
    }

    toModel (opts) {
        const now = Date.now();
        opts.extend = Number(opts.extend) || 0;
        opts.path = opts.path || this.combileDbPath(opts);
        opts.id = !opts.extend && opts.id || utils.getID();
        opts.is_used = opts.extend ? 1 : opts.is_used;
        opts.created_at = opts.created_at || now;
        opts.category = opts.category || 'score';
        return super.toModel(opts);
    }

    toFront (record) {
        if(record.path) {
            record.path = FILE_SEVER + record.path;
            if(record.extend) {
                const index = record.path.lastIndexOf('.');
                record.path = `${record.path.slice(0,index)}-${record.extend}${record.path.slice(index)}`
            }
        }
        return record;
    }

    toDbPath(str) {
        const reg = /-[0-9]{1,2}\./g
        return str?.split('?')[0].replace(Os.homedir(),'').replace(FILE_SEVER,'').replace(reg, '.');
    }

    toFilePath(str,extend) {
        let db_path = this.toDbPath(str);
        if(extend) {
            const index = db_path.lastIndexOf('.');
            db_path = `${db_path.slice(0,index)}-${extend}${db_path.slice(index)}`
        }
        return `${Path.resolve('.')}/res${db_path}`;
    }

    combileDbPath({category,name,id,ext}) {
        return `${this.combileDbBasePath({category,name,id})}${ext}`;
    }
    combileDbBasePath({category,name,id}) {
        return `/${category}/${name}_${id}`;
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

    async updatePath (path, {category, name, id, ext}, manager) {
        const origin_path = this.toDbPath(path);
        const origin_ext = Path.extname(origin_path);
        ext = ext || origin_ext;
        const target_path = this.combileDbPath({category,name,id, ext});
        const update_data = {
            name,
            path: target_path
        }
        if(id) await this.update({path: origin_path, extend: 0}, {id}, manager);
        await this.update({path: origin_path}, update_data, manager);

        let count = 0;
        let _path = this.toFilePath(path);
        const origin_base_path = origin_path.replace(origin_ext,'').split('-')[0];
        const target_base_path = target_path.replace(ext,'');
        const origin_base_file_path = _path.split(origin_base_path)[0]+origin_base_path;
        while(Fs.existsSync(_path)) {
            Fs.renameSync(_path, _path.replace(origin_ext,ext).replace(origin_base_path,target_base_path));
            _path = `${origin_base_file_path}-${++count}${origin_ext}`
        }

        return {path: target_path};
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

    async deleteExtendPath(path, manager) {
        this.deleteFile(path, false);
        return this.delete({
            path,
            extend: Not(0)
        }, manager);
    }

    async deleteByPath(path, manager) {
        if(!path) return;
        if(path.constructor == String) path = [path];

        this.deleteFile(path,);
        return super.delete({path}, manager);
    }

    deleteFile(path, isIncludesPath = true) {
        if(!path) return;
        if(path.constructor == String) path = [path];

        path.map(async p => {
            if(!p) return;
            let count = 0;
            let p1 = this.toFilePath(p);
            while(Fs.existsSync(p1)) {
                if(isIncludesPath || count) Fs.unlinkSync(p1);
                p1 = this.toFilePath(p,++count);
            }
        });
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