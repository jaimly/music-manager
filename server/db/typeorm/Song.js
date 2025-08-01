const {typeorm: Base} = require('koa2frame');

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
        category: {
            type: "varchar",
            length: 100,
            nullable: false,
            default: "未分类",
            comment: "所属目录"
        },
        score: {
            type: "varchar",
            length: 255,
            nullable: false,
            default: "",
            comment: "歌谱路径"
        },
        is_extend: {
            type: "tinyint",
            unsigned: true,
            nullable: false,
            default: 0,
            comment: "歌谱是否多页"
        },
        lyrics: {
            type: "varchar",
            length: 255,
            nullable: false,
            default: "",
            comment: "歌词"
        },
        order_num: {
            type: "int",
            unsigned: true,
            nullable: false,
            default: 0,
            comment: "排序"
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
        "category": "IDX_CATEGORY", "columns": ["category"]
    },{
        "order_num": "IDX_ORDER", "columns": ["order_num"]
    }]
};

class Song extends Base {
    constructor() {
        super('song', schema, 'music_manager', null, 'song');
    };
}

const instance = new Song();
module.exports = instance;