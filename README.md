# DevNTool
一些Web开发相关工具的DIY或收集（部分工具加载太慢进行本地化部署）

## 工具清单
* 接口调试工具： HttpTest
* URLEncode编码/解码：  URLEncode
* 待办清单：    ToDoList
* IconFont字体预览查看工具： IconFontViewer
* Github目录下载：      GitHubDownloader
* 多连接打包下载：      MultiLinkDownloader
* 简易M3U8播放器：      m3u8
* 文本转二维码工具：    QRCode
* PDF转换工具（规划中）：

## 启动
``` bat
node ..\\LiteWebsite\\node_web\\run.js -c config.json
```

## PM2 守护
``` bat
pm2 start pm2.json --watch
```
其中pm2.json格式如下
```json
{
    "name": "Post_Tool",
    "name_//": "应用名称",
    "script": "..\\LiteWebsite\\node_web\\run.js",
    "script_//": "实际启动脚本_需要绝对路径",
    "cwd": "..\\LiteWebsite\\node_web",
    "cwd_//": "当前工作路径_改成绝对路径",
    "args": "-c ..\\config.json",
    "ignore_watch": [
        "Log",".git"
    ],
    "watch_options": {
        "followSymlinks": false
    },
    "env": {
        "NODE_ENV": "production"
    },
    "env_production_": "环境参数，当前指定为生产环境"
}
```