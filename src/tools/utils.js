const toUpperLower = (str, is_first=true, symbol='/') => {
    return str.split(symbol).map((item,i) => {
        if(!item) return '';
        if(!is_first && i === 0) return item;
        return item[0].toUpperCase() + item.slice(1);
    }).join('');
};

const getTarget = (arr,key,val, keep_children) => {
    if(key && val && arr) {
        for(let rt of arr) {
            const _rt = Object.assign({}, rt);
            const {children} = _rt;
            if(!keep_children) delete _rt.children;
            if(rt[key] === val) return [_rt];
            if(children) {
                const childs = getTarget(children, key, val);
                if(childs.length) return [_rt].concat(childs);
            }
        };
    }
    return [];
};

const getRoute = (arr, key) => {
    const back = getTarget(arr, 'key', key);
    if(back.length) return back;

    const target = arr.find(x=>
        x.key.includes('/:') && key.indexOf(x.key.split('/:')[0]) === 0
    );
    if(target) {
        const target_infos = target.key.split('/:');
        const id_keys = target_infos.slice(1);
        const ids = key.replace(target_infos[0], '').split('/').slice(1);
        let _arr = arr;
        id_keys.map((id_key,i) => {
            let parent;
            switch(id_key) {
                case 'first_menu_id':
                    parent = arr.find(x=>x.id === ids[i]);
                    break;
                case 'article_id':
                    parent = {
                        key,
                        label: target.label
                    }
                    break;
                case 'second_menu_id':
                default:
                    if(_arr) parent = _arr.find(x=>x.id === ids[i]);
                    break;
            }
            if(parent) {
                const _parent = Object.assign({},parent);
                _arr = _parent.children;
                delete _parent.children;
                back.push(_parent);
            }
            return id_key;
        });
    }
    return back;
}

const getStyle = str => {
    const style = {};
    str.split(';').map(x=>{
        if(!x) return null;
        const xs = x.split(":");
        if(xs.length !== 2) return null;
        style[toUpperLower(xs[0].trim(),false,'-')] = String(xs[1].trim());
        return null;
    });
    return style;
}

const getJsx = ({type, className, style, text}) => {
    let html_str = `<${type} key=${type+Math.random()*1000}`;
    if(className) html_str += ` class=${className}`;
    if(style) html_str += ` style=${style}`
    html_str += `>${text}</${type}>`;
    return <div key={`div${Math.random()*1000}`} dangerouslySetInnerHTML={{__html: html_str}}/>;
}

/**
 * 获取一个时间的相关时间（星期一，星期日，下星期一等等）
 * @param time
 * @returns {Date}
 */
const getDate = time => {
    let info = time?new Date(time):new Date(),
        date = time?new Date(time):new Date(),
        one_day_time = 24*60*60*1000,
        one_week_time = 7*one_day_time;

    info.one_day = one_day_time;

    date.setHours(0, 0, 0, 0);
    info.day_start = date.getTime();
    info.tomorrow = info.day_start + one_day_time;
    info.day_end = info.tomorrow - 1;

    let weekday = date.getDay() || 7;
    date.setDate(date.getDate() - weekday + 1);
    info.monday = date.getTime();
    info.next_monday = info.monday + one_week_time;
    info.sunday = info.next_monday - one_day_time;
    info.format = function(fmt){
        let o = {
            "M+": info.getMonth() + 1, //月份
            "d+": info.getDate(), //日
            "h+": info.getHours(), //小时
            "m+": info.getMinutes(), //分
            "s+": info.getSeconds(), //秒
            "q+": Math.floor((info.getMonth() + 3) / 3), //季度
            "S": info.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)){
            fmt = fmt.replace(RegExp.$1, (info.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        Object.keys(o).map(k => {
            if (new RegExp(`(${k})`).test(fmt)){
                fmt = fmt.replace(
                    RegExp.$1,
                    (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))
                );
            }
        });

        return fmt;
    };

    return info;
};

export {
    toUpperLower,
    getTarget,
    getRoute,
    getStyle,
    getJsx,
    getDate
}