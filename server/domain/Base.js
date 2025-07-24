"use strict";

try {require('typeorm');}catch(err) {return;}

const {In,EntityManager,Brackets,FindOperator} = require('typeorm');
const {db: DbIndex, utils: {isValue}, error: Status} = require('koa2frame');

class Base {
    constructor(table_name) {
        this.cls =  DbIndex.getDB(table_name);
        this.db =  DbIndex.get(table_name);
        this.connector = this.cls.connection;
        this.model = this.cls.schema;
    }

    toDbIn(keys,split_key) {
        if(!keys || !keys.length) return null;
        if(keys.constructor === String) keys = keys.split(split_key || ',');
        if(keys.constructor === Array) keys = In(keys);
        return keys;
    }

    toCondition (params) {
        params = Object.assign({},params);
        const {
            per_page,
            page,
            offset,
            fields,
            orderBy,
            leftJoins,//外表关联：1对1
            leftJoinAndMapManys,//外表关联：1对多
            groupBy,
            $andOrs,
            $orAnds,
            $or,
            $and,
            $where,
            manager
        } = params;

        delete params.per_page;
        delete params.page;
        delete params.offset;
        delete params.fields;
        delete params.orderBy;
        delete params.leftJoins;
        delete params.leftJoinAndMapManys;
        delete params.groupBy;
        delete params.$or;
        delete params.$and;
        delete params.$where;
        delete params.$andOrs;
        delete params.$orAnds;
        delete params.manager;

        for(let [key,val] of Object.entries(params)) {
            if(Object.is(val,undefined) || Object.is(val,null) || Object.is(val,NaN)) delete params[key];
            else if(val.constructor == Array) params[key] = this.toDbIn(val);
        }

        return {
            per_page:  parseInt(per_page),
            page: parseInt(page),
            offset: parseInt(offset),
            fields,
            orderBy,
            leftJoins,
            leftJoinAndMapManys,
            groupBy,
            $or,
            $and,
            $where,
            $andOrs,
            $orAnds,
            manager,
            condition: params
        }
    }

    toModel (opts) {
        const dbKeys = this.model.options.columns;
        const back = {};
        for(let [key,val] of Object.entries(dbKeys)) {
            const opt = opts[key];
            if(Object.is(opt,NaN) || Object.is(opt,null) || Object.is(opt,undefined)) {
                if(val.default) back[key] = val.default;
                else if(val.type.includes("float") || val.type.includes("numeric") || val.type.includes("int")) back[key] = 0;
                else back[key] = "";
            }else {
                back[key] = opt;
            }
        }
        return back;
    }

    /**
     * @param {object} params --前端传入参数
     * @property {integer}  params.per_page --每页数量。
     * @property {integer}  params.page --当前页。
     * @property {array|string}  params.fields --与返回字段相同,优先级低
     * @param {array|string} fields --返回字段。若为字符串，用逗号隔开
     * @param {object} orderBy -- 1为升序；-1为降序。如：{created_at:1}
     * @param {boolean} not_raw -- getMany(leftJoinAndMapManys)？getRawMany. 
     * leftJoin 与 leftJoinAndMapManys 不能同时存在
     */
    async list (params, fields, orderBy, not_raw) {
        params = params || {};
        if(fields) params.fields = fields;
        if(orderBy) params.orderBy = orderBy;

        const back = await this.getFindBuilder(params,not_raw)[not_raw?"getMany":"getRawMany"]();
        return back.map(item => Object.assign({},item));
    }

    async findByPage (params, ...arg) {
        const total_count = await this.count(params);
        if(!total_count) return Promise.reject({
            ok: Status.ok.ok,
            data: {total_count, rows:[]}
        });

        params.per_page = params.per_page || 10;
        params.page = params.page || 1;

        const rows = await this.list(params, ...arg);
        return {
            total_count,
            rows
        }
    }

    async count (params,manager) {
        const builder = this.getDb(manager || params.manager).createQueryBuilder("a");
        this.setBuilderWhere(builder,params);

        const {groupBy} = params;
        if(!groupBy) return builder.getCount();

        const result = await builder.groupBy().select(`COUNT(DISTINCT ${groupBy}) as cnt`).execute();
        return result[0].cnt;
    }

    async findOne (params, err, not_raw) {
        const data = await this.getFindBuilder(params,not_raw)[not_raw?"getOne":"getRawOne"]();

        err = err || {};
        return data ? Object.assign({},data) : Promise.reject({
            ok: err.ok || Status.no_records_found.ok, 
            msg: err.msg || Status.no_records_found.msg,
            data: err.data
        });
    }

    async isReferred (params, err, not_raw) {
        const data = await this.getFindBuilder(params,not_raw)[not_raw?"getOne":"getRawOne"]();

        err = err || {};
        if(data) return Promise.reject({
            ok: err.ok || Status.record_referred.ok,
            msg: err.msg || Status.record_referred.msg,
            data: err.data || data
        });
    }

    save (models, manager) {
        if(!models) return {};
        if(models.constructor == Object) models = this.toModel(models);
        else if(models.constructor == Array) models = models.map(model => {
            return this.toModel(model);
        })
        else return;
        
        return this.getDb(manager).save(models);
    }

    insert (models, manager) {
        if(!models) return {};
        if(models.constructor == Object) models = this.toModel(models);
        else if(models.constructor == Array) models = models.map(model => {
            return this.toModel(model);
        })
        else return;
        
        return this.getDb(manager).insert(models);
    }

    async update (params, target, manager) {
        if(!params || !target || !Object.keys(target)) return 0;

        const builder = this.getDb(manager)
                            .createQueryBuilder()
                            .update(this.model)
                            .set(target);

        this.setBuilderWhere(builder, params);
        return (await builder.execute()).affected;
    }

    async delete (params, manager) {
        const builder = this.getDb(manager)
                    .createQueryBuilder()
                    .delete()
                    .from(this.model);
        
        this.setBuilderWhere(builder, params)
        return (await builder.execute()).affected;
    }

    getDb(manager) {
        return Boolean(manager && manager.constructor == EntityManager) 
                    ? manager.getRepository(this.model)
                    : this.db;
    }

    setBuilderWhere(builder, params) {
        let {
            condition,
            $or,
            $and,
            $where,
            $andOrs,
            $orAnds,
            leftJoins,
            leftJoinAndMapManys
        } = this.toCondition(params);
        builder.where(condition);

        if(leftJoins) {
            if(leftJoins.constructor != Array) leftJoins = [leftJoins];
            leftJoins.map(leftJoin => {
                builder.leftJoin(leftJoin.entity, leftJoin.name || leftJoin.entity.options.name, leftJoin.on);
            });
        }

        if(leftJoinAndMapManys) {
            if(leftJoinAndMapManys.constructor != Array) leftJoinAndMapManys = [leftJoinAndMapManys];
            leftJoinAndMapManys.map(leftJoinAndMapMany => {
                builder.leftJoinAndMapMany(
                    leftJoinAndMapMany.key, 
                    leftJoinAndMapMany.entity, 
                    leftJoinAndMapMany.name || leftJoinAndMapMany.entity.options.name, 
                    leftJoinAndMapMany.on
                );
            });
        }

        if($and) {
            $and.map(and => {
                if(and.constructor == Array) {
                    builder.andWhere(and[0]);
                    builder.setParameters(and[1]);
                }else {
                    builder.andWhere(and);
                }
            });
        }

        if($or) {
            $or.map(or => {
                if(or.constructor == Array) {
                    builder.orWhere(or[0]);
                    builder.setParameters(or[1]);
                }else {
                    builder.orWhere(or);
                }
            });
        }

        if($where) {
            $where.map(_where => {
                if(!_where) return;
                if(_where.constructor == Object) {
                    _where = this.objectToWhere(_where,builder);
                }
                if(!_where) return;
                if(_where.constructor == Array) {
                    _where.map(w => {
                        if(!w) return;
                        if(w.constructor == Array) builder.andWhere(w[0],w[1]);
                        else builder.andWhere(w);
                    });
                } else builder.andWhere(_where);
            });
        }

        if($orAnds) {
            $orAnds.map(and => {
                if(and.constructor != Array) {
                    builder.andWhere(and);
                }else {
                    builder.orWhere(this.toBrackets(and, 'andWhere'));
                }
            });
        }

        if($andOrs) {
            $andOrs.map(or => {
                if(or.constructor != Array) {
                    builder.orWhere(or);
                }else {
                    builder.andWhere(this.toBrackets(or, 'orWhere'));
                }
            });
        }

        return builder;
    }

    toBrackets(arr, _where='andWhere') {
        return new Brackets(qb => {
            let flag = false;
            arr.map(val => {
                switch(val && val.constructor) {
                    case String:
                        const [_s,_v] = val.split('?');
                        const _obj = {};
                        if(_v) _v.split('&').map(__s => {
                            const [__k,__v] = __s.split('=');
                            _obj[__k] = __v;
                        });                        
                        qb[flag?_where:'where'](_s, _obj);
                        flag = true;
                        break;
                    case Object:
                        this.objectToWhere(val,qb).map(w => {
                            if(!w) return;
                            if(w.constructor == Array) qb[flag?_where:'where'](w[0],w[1]);
                            else qb[flag?_where:'where'](w);
                            flag = true;
                        });
                        break;
                    case Array:
                        qb[flag?_where:'where'](this.toBrackets(val,_where == 'andWhere' ? 'orWhere' : 'andWhere'));
                        flag = true;
                        break;
                }
            });
        })
    }

    objectToWhere(obj,builder) {
        return Object.keys(obj).map(k => {
            const _k = k;
            const v = obj[k];
            if(!isValue(v)) return;
            if(k.includes('.')) {
                k = k.split('.');
                k = `\`${k[0]}\`.\`${k[1]}\``;
            } else {
                k = `\`${k}\``;
            }

            const code_random = Math.floor(Math.random()*100000);
            if (v instanceof FindOperator) {
                const parameters = [];
                const parameterValues = {};
                if (v.useParameter) {
                    const realParameterValues = v.multipleParameters ? v.value : [v.value];
                    realParameterValues.map((v, index) => {
                        parameters.push(`:${_k}_${index}${code_random}`);
                        parameterValues[`${_k}_${index}${code_random}`] = v;
                    });
                }
                const rawWhere = builder.computeFindOperatorExpression(v, k, parameters);
                return [rawWhere, parameterValues];
            } else {
                const v_code = `${_k}_${code_random}`;
                return [`${k} = :${v_code}`, {[v_code]: v}];
            }
        });
    }

    getFindBuilder (params,not_raw) {
        let {
            per_page,
            page,
            offset,
            fields,
            orderBy,
            groupBy,
            manager
        } = this.toCondition(params);

        const builder = this.getDb(manager).createQueryBuilder("a");
        this.setBuilderWhere(builder,params);

        if(per_page && per_page > -1) {
            if(page && page > 1) builder.offset(per_page*(page-1));
            if(offset) builder.offset(offset);
            builder.limit(per_page);
        }

        if(orderBy) {
            let _count = 0;
            for(let [key,val] of Object.entries(orderBy)) {
                builder[_count ? "addOrderBy": "orderBy"](key, val>0?"ASC":"DESC");
                _count++;
            }
        }

        if(groupBy) {
            builder.groupBy(groupBy);
        }

        const dbKeys = this.model.options.columns;
        fields = fields || Object.keys(dbKeys);
        if(fields.constructor == String) fields = fields.split(',');
        if(fields.length) {
            const selects = [];
            fields.map(f => {
                const arr = f.split(/ as /i);
                // if(arr.length < 2) arr.push(f);
                if(dbKeys[arr[0]]) arr[0]=`a.${arr[0]}`;
                if(arr[0].includes('.')) {
                    let str = arr[0];
                    if(!not_raw || arr[1]) str += ` as '${arr[1] || f}'`;
                    selects.push(str);
                    if(groupBy && groupBy!=arr[0]) builder.addGroupBy(arr[0]);
                } else if(f.includes('(')) {
                    selects.push(f);
                }
            })
            builder.select(selects);
        }

        return builder;
    }
}

module.exports = Base;