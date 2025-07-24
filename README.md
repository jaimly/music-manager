# Music Manager
音乐列表管理及展示

## 项目部署：
1. 具备条件
> - node >= 12.22.0
> - mysql 
> - Linux命令：git (用于自动化更新) 
> - Linux命令：docker (用于自动化更新) 
> - Linux命令：sh (用于自动化更新)
2. 更新/部署方法一：linux环境自动化
> - git clone https://jaimly:[密码]@gitee.com/jaimly/auto-parts
> - git remote set-url origin https://jaimly:[密码]@gitee.com/jaimly/auto-parts
> - 安装mysql并创建music_manager库
> - npm run update
2. 更新/部署方法二：手动
> - 下载代码
> - 安装mysql并创建music_manager库
> - 修改 server/etc/config.js 的 ENV 的各项值，或添加环境变量
> - npm i --production --ignore-scripts
> - npm run build
> - npm run start 

## 项目结构：
>|
│  .gitignore
│  package.json
│  package-lock.json
│  README.md
│  server.js -- server启动文件
 |  update.sh -- linux环境自动更新
│  
├─dist -- 前端打包目录
│  │  index.html -- 可直接访问界面
│              
├─log --日志目录
│      error.log
│              
├─public --web资源目录
│      index.html
│      
├─server -- 后端代码目录
│  ├─api -- server接口目录
│  │      product.js
│  │      
│  ├─domain -- server处理层目录
│  │      Base.js
│  │      
│  └─etc -- server配置目录
│          development.js
│          env.js
│          production.js
│          route.js
│          
└─src -- 前端代码目录
    │  index.js            
