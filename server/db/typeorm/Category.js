const {typeorm: Base, utils} = require('koa2frame');

const schema = {
    columns: {
        id: {
            type: "char",
            length: 16,
            nullable: false,
            primary: true
        },
        name: {
            type: "varchar",
            length: 255,
            nullable: false,
            default: "",
            comment: "名称"
        },
        is_show: {
            type: "tinyint",
            unsigned: true,
            nullable: false,
            default: 1,
            comment: "是否展示"
        },
        order_num: {
            type: "int",
            unsigned: true,
            nullable: false,
            default: 0,
            comment: "序号"
        },
        created_at: {
            type: "bigint",
            unsigned: true,
            nullable: false,
            comment: "创建时间"
        },
        updated_at: {
            type: "bigint",
            unsigned: true,
            nullable: false,
            comment: "修改时间"
        }
    },
    indices: [{
        "is_show": "IDX_IS_SHOW", "columns": ["is_show"]
    },{
        "order_num": "IDX_ORDER", "columns": ["order_num"]
    }]
};

class Category extends Base {
    constructor() {
        super('category', schema, 'music_manager', null, 'category');
    };

    async initTable () {
        return super.initTable(
            Object.keys(schema.columns).join(','),
            [`"${utils.getID()}","未分类",0,1,${Date.now()},${Date.now()}`]
        );
    }
}

const instance = new Category();
module.exports = instance;