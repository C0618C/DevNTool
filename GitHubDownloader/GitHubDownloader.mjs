/**
 * 简易实现的事件监听
 */
class EasyEvent {
    constructor(eventRunner) {
        this.eventRunner = eventRunner;
    }

    on(event, fn) { this.eventRunner.addEventListener(event, fn); }
    once(event, fn) {
        let fnCell = (event) => {
            fn(event);
            this.eventRunner.removeEventListener(event.type, fnCell);
        }
        this.eventRunner.addEventListener(event, fnCell);
    }
    emit(event, data) {
        this.eventRunner.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
}


class GitHubDownloader extends EasyEvent {
    /**
     * 下载助手，每个对象服务一个下载任务
     * @param {x} url 下载的起点地址
     */
    constructor(eventRunner, url) {
        super(eventRunner);

        //输入地址，用户输入的地址，兼容多种格式
        this.downloadUrl = url;

        //仓库信息
        this.repoInfo = {
            ownerName: '',      //用户名
            projectName: '',    //项目名
            branchName: '',     //指定下载的分支
            dirPath: '',        //需要下载的目录
        }

        this.fileHub = [];      //文件仓库

        //进度信息
        this.processInfo = {
            downloadingNum: 0,  //正在下载数
            errorNum: 0, // 出错数
            finishNum: 0, // 已下载数
            allNum: 0,      //任务总数
            //统计类
            totalSize: 0,        //总文件字节数
            doneSize: 0,         //已完成字节数
            maxFileSize: 0,       //最大的文件字节数
        }

        this.domHub = null;     //每一文件 对应的显示元素仓库
        // this.renderUI = null;
        // this.taskClickCallback = null;  //点击每个任务的回调处理
    }

    ///—————————————————————具体实现逻辑—————————————————————————///
    /**
     * 解释用户输入的文本确认任务目标的仓库信息
     * @param {String} url 用户输入的仓库信息，可以覆盖实例化时提供的地址，用于开始新任务
     */
    async AnalyseRepoInfo(url = "", callback) {
        if (url !== "") this.downloadUrl = url;

        //分析仓库信息
        //情况一：提供的是克隆地址、仓库某页地址
        /*
            例：
                https://github.com/mdn/js-examples.git
                https://github.com/mdn/js-examples/tree/main
        */
        let cloneReg = /.*?github\.com\/([^/]+)\/(([^/]+(?=\.git$|\/tree))|([^/]+))/;//情况一格式
        let rAndnReg = /^([^/]+)\/([^/]+)(?:\/([^/]+)(?:\/(.*))?)?$/;          //情况二 格式    匹配：仓库用户/项目名/分支/文件或文件夹路径
        if (cloneReg.test(this.downloadUrl)) {
            let matchData = this.downloadUrl.match(cloneReg);
            this.repoInfo.ownerName = matchData[1];
            this.repoInfo.projectName = matchData[2];
        } else if (rAndnReg.test(this.downloadUrl)) {
            /* 情况二：提供简易地址
                例：mdn/js-examples/main
            */
            let matchData = this.downloadUrl.match(rAndnReg);
            this.repoInfo.ownerName = matchData[1];
            this.repoInfo.projectName = matchData[2];
            if (matchData[3]) this.repoInfo.branchName = matchData[3];
            if (matchData[4]) this.repoInfo.dirPath = matchData[4];
        }

        //分支判断逻辑
        if (this.repoInfo.branchName) return callback?.call();
        let branchAndTag = [...await this.FetchBranches(), ...await this.FetchTags()]
        branchAndTag.map(item => item.name).some(branch => {
            if (this.downloadUrl.includes(branch)) {
                this.repoInfo.branchName = branch;
            }
        });

        if (!this.repoInfo.branchName) {        //没指定分支时，选择默认分支
            let defBranchName = ["main", "master"];
            for (let bn of defBranchName) {
                if (branchAndTag.some(b => b.name === bn)) {
                    this.repoInfo.branchName = bn;
                    break;
                }
            }
        }

        //下载路径判断逻辑
        if (this.downloadUrl.endsWith(".git")) return callback?.call();       //下载整个仓库
        if (this.downloadUrl.includes(`/tree/${this.repoInfo.branchName}/`)) {  //例：https://github.com/mdn/js-examples/tree/main/module-examples
            this.repoInfo.dirPath = this.downloadUrl.replace(new RegExp(`^.*\/tree\/${this.repoInfo.branchName}\/`), "");
        }
        callback?.call();
    }


    /**
     * 开始任务
     */
    async Start(download = true) {
        if (!this.repoInfo.ownerName || !this.repoInfo.projectName) await this.AnalyseRepoInfo();
        let tree = await this.FetchTree();

        //初始化下载任务
        this.InitProcess(tree.tree);

        //初始化界面进度
        this.SyncDom();

        this.emit("update-repo-info");

        if (download) this.StartDownLoad();
    }

    /**
     * 开始下载
     */
    StartDownLoad() {
        for (let i = 0; i < Math.min(this.fileHub.length, 10); i++)     //先一起跑10个看看
            this.DownloadFile();

        this.render();
    }

    /**
     * 从队列里，下载一个文件
     * @returns 
     */
    DownloadFile() {
        let curFile = this.fileHub.find(file => file.status == "");
        if (!curFile) return;       //没有在排队的任务了

        curFile.status = "processing";
        let curDom = this.GetDom(curFile.sha, curFile);
        // curDom.box.className = "file processing";   //TODO: 需要丢到渲染线程处理
        this.processInfo.downloadingNum += 1;

        this.FetchFile(curFile)
            .then((fileData) => {
                curFile.fileData = fileData;
                curFile.status = "finish";
                this.processInfo.finishNum += 1;
            })
            .catch((err) => {
                console.log("待处理的错误：", err);
                curFile.status = "error";
                this.processInfo.errorNum += 1;
            })
            .finally((info) => {
                this.DownloadFile();
                this.processInfo.downloadingNum -= 1;
            });

        // console.log(this);
    }

    SaveAsZip() {
        console.log("开始制作压缩包");
        const zip = new JSZip()
        this.fileHub.forEach(item => item.status === 'finish' && zip.file(item.path, item.fileData))
        zip.generateAsync({ type: 'blob' }).then((content) => {
            let a = document.createElement('a')
            a.download = `${[this.repoInfo.projectName, this.repoInfo.branchName, this.repoInfo.dirPath].join('/').replace(/\//g, '_')}.zip`
            a.href = URL.createObjectURL(content)
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            a.remove();
            console.log("下载压缩包");
        })

    }

    /**
     * 刷新UI
     * @returns 
     */
    render() {
        for (let file of this.fileHub) {
            let dom = this.GetDom(file.sha);
            let cn = "file " + file.status;
            let pn = Math.floor(file.process * 100) + "%";

            if (dom.box.className != cn) dom.box.className = cn;
            if (dom.bar.style.width != pn) dom.bar.style.width = pn;
        }

        this.emit("render-ui");

        if (this.processInfo.allNum === this.processInfo.finishNum) {
            this.SaveAsZip();
            return;
        } else {
            requestAnimationFrame(() => { this.render() });
        }
    }

    /**
     * 初始化下载任务
     * @param {*} tree api返回的目录
     */
    InitProcess(tree) {
        for (let item of tree) {
            if (item.type === "tree") continue;
            if (this.repoInfo.dirPath !== "" && !item.path.includes(this.repoInfo.dirPath)) continue;

            item.dataUrl = `https://raw.githubusercontent.com/${this.repoInfo.ownerName}/${this.repoInfo.projectName}/${this.repoInfo.branchName}/${item.path}`
            item.status = "";

            this.fileHub.push(item);
            this.processInfo.totalSize += item.size;
            this.processInfo.maxFileSize = Math.max(this.processInfo.maxFileSize, item.size);
        }

        //优化大小对比悬殊的情况
        let overHalf = this.fileHub.filter(f => f.size * 2 > this.processInfo.maxFileSize);
        if (overHalf.length <= 1) this.processInfo.maxFileSize /= 2;
    }

    /**
     * 刷新，创建所有文本进度块
     * @param {*} tree 
     */
    SyncDom() {
        this.domHub = new Map();
        let mBox = document.getElementById("main");
        mBox.innerHTML = "";
        let files = [];
        for (let f of this.fileHub) {
            let curDom = this.GetDom(f.sha, f);
            files.push(curDom);

            curDom.box.className = "file " + f.status
        }

        this.processInfo.allNum = files.length; //设置总数
        mBox.append(...files.map(f => f.box));
    }

    /**
     * 取得文件对应的元素
     * @param {*} sha 
     * @param {*} fileName 
     * @returns 
     */
    GetDom(sha, file) {
        let key = "SHA_" + sha;
        let result = this.domHub.get(key);
        if (!this.domHub.has(key)) {
            let dom = document.createElement("div");
            dom.className = "file";
            dom.style.width = `${(file.size / this.processInfo.maxFileSize * 100)}%`;
            dom.setAttribute("title", file.path);
            dom.setAttribute("data-sha", sha);
            dom.addEventListener("click", () => {
                let fileInfo = this.fileHub.find(f => f.sha == sha);
                if (!fileInfo) return console.warn("处理点击任务失败：找不到任务对应的下载信息。") || 0;

                //出错任务重启
                if (fileInfo.status === "error") this.ReActive(sha);

                // this?.taskClickCallback(fileInfo);
                this.emit("click-task-bar", fileInfo);
                // });
                // dom.addEventListener("hover", () => {
                // let fileInfo = this.fileHub.find(f => f.sha == sha);
                if (fileInfo.status === "finish" && (fileInfo.path.endsWith("png") || fileInfo.path.endsWith("jpg") || fileInfo.path.endsWith("gif"))) {
                    let i = new Image();
                    i.src = window.URL.createObjectURL(fileInfo.fileData);
                    document.body.appendChild(i);
                    setTimeout(() => {
                        URL.revokeObjectURL(i.src);
                    }, 1000);
                }
                // this.emit("hover-task-bar", fileInfo);
            });

            let text = document.createTextNode(file.path);
            let bar = document.createElement("div");
            bar.className = "bar";
            dom.appendChild(text);
            dom.appendChild(bar);
            // document.getElementById("main").appendChild(dom);

            result = {
                box: dom,
                bar: bar,
                data: file
            }

            this.domHub.set(key, result);
        }

        return result;
    }

    /**
     * 激活所有出错的任务
     */
    ReActiveAll() {
        let eList = this.fileHub.filter(f => f.status == "error");

        for (let f of eList) {
            f.status = "";
        }
        this.processInfo.errorNum -= eList.length;
    }

    /**
     * 重新激活任务
     * @param {*} sha 任务sha
     * @returns 
     */
    ReActive(sha) {
        let fInfo = this.fileHub.find(f => f.sha === sha);
        if (!fInfo) return;

        if (fInfo.status !== "error") return;
        fInfo.status = "";
        this.processInfo.errorNum = Math.max(this.processInfo.errorNum - 1, 0);
    }

    Fetch(url, option) {
        return fetch(url, option)
            .then((response) => {
                if (!response.ok) throw new Error('请求分支信息失败，请检查仓库地址，结果：' + response.status);
                return response.json()
            })
            .catch(err => {
                alert(err + `\n\n所有者:${this.repoInfo.ownerName}\n仓库名:${this.repoInfo.projectName}`);
            })
    }

    /**
     * 更新分支信息
     */
    FetchBranches() {
        if (!this.repoInfo.ownerName || !this.repoInfo.projectName) throw ("仓库信息不正确，请提供正确的地址。");

        return this.Fetch(`https://api.github.com/repos/${this.repoInfo.ownerName}/${this.repoInfo.projectName}/branches`);
    }
    /**
     * 获取标签信息
     */
    FetchTags() {
        if (!this.repoInfo.ownerName || !this.repoInfo.projectName) throw ("仓库信息不正确，请提供正确的地址。");

        return this.Fetch(`https://api.github.com/repos/${this.repoInfo.ownerName}/${this.repoInfo.projectName}/tags`);
    }

    /**
     * 获取目录
     */
    FetchTree() {
        return this.Fetch(`https://api.github.com/repos/${this.repoInfo.ownerName}/${this.repoInfo.projectName}/git/trees/${this.repoInfo.branchName}?recursive=1`);
    }

    /**
     * 取回文件
     * @param {*} fileInfo 
     */
    FetchFile(fileInfo) {
        const chunks = [];
        let totalBytesReceived = 0;
        // let totalBytesExpected = -1;
        let pInfo = this.processInfo;
        return fetch(fileInfo.dataUrl)
            .then(response => {
                // 获取响应的总大小  
                // const contentLength = response.headers.get('Content-Length');
                // totalBytesExpected = contentLength ? parseInt(contentLength, 10) : -1;

                // 创建一个读取器  
                const reader = response.body.getReader();

                // 读取流数据  
                function readStream() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            return;
                        }

                        // 更新已接收的字节数  
                        totalBytesReceived += value.length;

                        // 将数据块添加到chunks数组中  
                        chunks.push(value);

                        // 设置进度
                        fileInfo.process = totalBytesReceived / fileInfo.size;
                        pInfo.doneSize += value.length;

                        // 继续读取  
                        return readStream();
                    });
                }

                // 开始读取流  
                return readStream();
            })
            .then(() => {
                return new Blob(chunks);
            });
    }
}


export { GitHubDownloader };