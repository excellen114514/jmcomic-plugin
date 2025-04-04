# yz-jmcomic-plugin
一个适用于yunzai的jm查本插件包
> [!WARNING]
> 爱护jm，不要爬那么多本，西门
> -- 官网地址: https://18comic.vip

## 想说的
- 本项目基于[Python API For JMComic (禁漫天堂)](https://github.com/hect0x7/JMComic-Crawler-Python/tree/master)简单改造而来
- 使用简单，容易上手
- 本插件包旨在一键部署化，是源于[yz-jmcomic.js](https://github.com/excellen114514/yz-jmcomic.js)的改造
  
## 食用方法
- 根目录运行
```shell
git clone --depth=1 https://github.com/excellen114514/jmcomic-plugin.git ./plugins/jmcomic-plugin/
```
- 先安装api的依赖和修改.env文件: #jm安装依赖, #jm路径写入
- 启动api:对bot发送 #jm(启动|重启)api
- 查本： #jm查{本子号}
- 检查api情况： #jm检查api
- 定时检查api情况（重启失效）：#jm定时检查

## 注意事项
- 需要准备python>=3.7环境 [戳我下载](https://www.python.org/downloads/)
- 塞了简单的配置文件，如需自己更改可 [戳此查看](https://github.com/hect0x7/JMComic-Crawler-Python/blob/master/assets/docs/sources/option_file_syntax.md)
- api会每隔一小时删除一次工作目录下除了long和pdf文件夹的所有文件夹
- 脚本有简单的崩溃重启，非正常退出(0 code)会重新执行命令

## 原理
- 使用Flask创建一个简单的webapi，并在node中用fetch请求和捕获异常
- 启动后本地地址应为 http://127.0.0.1:8000/jmd?jm=
- pdf请求地址为 http://127.0.0.1:8000/jmdp?jm=
- 检查status的地址为 http://127.0.0.1:8000/
- jmcomic库会先把本子下载，再进行长图拼接

## TODO
[ ]白名单

[ ]咕咕咕

## PR or Issue？
欢迎！pr审核一般在周末审核

## 许可证
本项目使用[MIT](https://zh.wikipedia.org/zh-hk/MIT%E8%A8%B1%E5%8F%AF%E8%AD%89)作为开源许可证

## 感谢
[Python API For JMComic (禁漫天堂)](https://github.com/hect0x7/JMComic-Crawler-Python/tree/master)