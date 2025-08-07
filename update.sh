# /bin/bash

# 预备 git、docker 命令

# 下载代码
# git clone https://gitee.com/jaimly/music-manager.git

Project=music-manager
DbName=music_manager

# 设置项目名、端口
read -p "端口:" Port
read -p "项目名后缀(可留空):" PROJECT_EXT
read -p "是否build前端文件(build填1):" IS_BUILD # build耗内存太大，可能会卡死
read -p "域名(留空即不更改Dockerfile):" Host
if [ $Host ]; then
    read -p "数据库用户:" MYSQL_USER
    read -p "数据库密码:" MYSQL_PASSWORD
fi


if [ $PROJECT_EXT ]; then
    Project=${Project}-$PROJECT_EXT
    DbName=${DbName}_$PROJECT_EXT
fi

# 更新代码
git pull origin master
echo "更新代码成功"

# 判断是否需要npm
cp package.json package.json1
package1_md5=`md5sum package.json1 | awk '{ print $1 }'`
package_md5=`md5sum package.json | awk '{ print $1 }'`
if [ ! -d "node_modules" ] || [ $package1_md5 != $package_md5 ]; then
    npm i --production --ignore-scripts
fi
rm -rf package.json1
echo "npm成功"

# 判断是否需要build前端
if [ $IS_BUILD == 1 ]; then
    npm run build
    echo "build前端成功"
fi

# 生成Dockerrile文件
if [ $Host ]; then
    if host $Host > /dev/null 2>&1; then
        FILE_SEVER=$Host
    else
        FILE_SEVER=$Host:$Port
    fi
    rm -rf Dockerfile
    echo "FROM node:22" >> Dockerfile
    echo "ENV NODE_ENV prod" >> Dockerfile
    echo "ENV MYSQL_HOST $Host" >> Dockerfile
    echo "ENV MYSQL_USER $MYSQL_USER" >> Dockerfile
    echo "ENV MYSQL_PASSWORD $MYSQL_PASSWORD" >> Dockerfile
    echo "ENV DATABASE_NAME ${DbName}" >> Dockerfile
    echo "ENV FILE_SEVER http://$FILE_SEVER/res" >> Dockerfile
    echo "WORKDIR /app" >> Dockerfile
    echo "COPY . /app/" >> Dockerfile
    echo "CMD npm start" >> Dockerfile
    echo "生成DockerFile文件"
fi

# 复制初始资源
\cp -rf res/* /home/www/${Project}
# 停止并删除容器
docker rm -f ${Project}
# 删除镜像
docker rmi ${Project}
# 生成镜像
docker build -t ${Project} .
# 启动容器
docker run -d --name ${Project} --restart=always -v /home/www/${Project}:/app/res -p $Port:3000 ${Project}