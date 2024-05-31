# 开发笔记

## API
### 仓库信息
```js
`https://api.github.com/repos/{用户名}/{仓库名}/git/trees/{分支}?recursive=1`
```
获取仓库的基本信息

### 分支信息
```js
`https://api.github.com/repos/{用户名}/{仓库名}/branches`
```

### 标签
```js
`https://api.github.com/repos/{用户名}/{仓库名}/tags`
```

### 下载文件
```js
`https://raw.githubusercontent.com/{用户名}/{仓库}/{分支}/{文件路径}`
```



#### 数据返回样本
https://api.github.com/repos/Momo707577045/m3u8-downloader/git/trees/master?recursive=1
```json
{
  "sha": "6e4fddc042ee4a765f9f27447fdda87fa2f3e5d2",
  "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/trees/6e4fddc042ee4a765f9f27447fdda87fa2f3e5d2",
  "tree": [
    {
      "path": ".gitignore",
      "mode": "100644",
      "type": "blob",
      "sha": "eacf3bb22690540e8e359fc2dee95428bff73642",
      "size": 24,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/eacf3bb22690540e8e359fc2dee95428bff73642"
    },
    {
      "path": "README-EN.md",
      "mode": "100644",
      "type": "blob",
      "sha": "e7772dcdd4c391bb30c6f32be5432fe63c4e76a3",
      "size": 9667,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/e7772dcdd4c391bb30c6f32be5432fe63c4e76a3"
    },
    {
      "path": "README.md",
      "mode": "100644",
      "type": "blob",
      "sha": "cae939378115f266263163f2dccd49948a7dac82",
      "size": 9143,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/cae939378115f266263163f2dccd49948a7dac82"
    },
    {
      "path": "StreamSaver.js",
      "mode": "100644",
      "type": "blob",
      "sha": "14974dcdca3699ef5c9683e54fbbeaddb3f88047",
      "size": 11168,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/14974dcdca3699ef5c9683e54fbbeaddb3f88047"
    },
    {
      "path": "aes-decryptor.js",
      "mode": "100755",
      "type": "blob",
      "sha": "2bd0db9e65fcdca56c831e4338da3f0594303f30",
      "size": 9427,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/2bd0db9e65fcdca56c831e4338da3f0594303f30"
    },
    {
      "path": "imgs",
      "mode": "040000",
      "type": "tree",
      "sha": "a1865cb248d186ea21d72888799809b0c1db2f65",
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/trees/a1865cb248d186ea21d72888799809b0c1db2f65"
    },
    {
      "path": "imgs/001.png",
      "mode": "100644",
      "type": "blob",
      "sha": "f73ace68d8aeb40c76b20267d97fdd6cd800a1c0",
      "size": 22417,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/f73ace68d8aeb40c76b20267d97fdd6cd800a1c0"
    },
    {
      "path": "imgs/002.png",
      "mode": "100644",
      "type": "blob",
      "sha": "93534e097aebd7e24e80fb44a245dfba3dca4b98",
      "size": 35754,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/93534e097aebd7e24e80fb44a245dfba3dca4b98"
    },
    {
      "path": "imgs/003.png",
      "mode": "100644",
      "type": "blob",
      "sha": "09ce1d07cd2a90b8e7ca9f4dca5ebf808afd0554",
      "size": 4808,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/09ce1d07cd2a90b8e7ca9f4dca5ebf808afd0554"
    },
    {
      "path": "imgs/close.png",
      "mode": "100644",
      "type": "blob",
      "sha": "06398a3a7d85fbaf85e038b9c4b5dfccde863843",
      "size": 840,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/06398a3a7d85fbaf85e038b9c4b5dfccde863843"
    },
    {
      "path": "index-en.html",
      "mode": "100644",
      "type": "blob",
      "sha": "4b8e4d621fb4d5a7e40ef8d1b838b0d65dc6f303",
      "size": 28360,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/4b8e4d621fb4d5a7e40ef8d1b838b0d65dc6f303"
    },
    {
      "path": "index.html",
      "mode": "100644",
      "type": "blob",
      "sha": "5fce358f1c1c60e4bd6dabb046ab7a595ca8ab84",
      "size": 33836,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/5fce358f1c1c60e4bd6dabb046ab7a595ca8ab84"
    },
    {
      "path": "m3u8-downloader.user.js",
      "mode": "100644",
      "type": "blob",
      "sha": "129f2423965e1140074f382a81499822cb53b960",
      "size": 13015,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/129f2423965e1140074f382a81499822cb53b960"
    },
    {
      "path": "mitm.html",
      "mode": "100644",
      "type": "blob",
      "sha": "f3d76bd83b382d4093457ca1933cb9c1f6e68f7c",
      "size": 5873,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/f3d76bd83b382d4093457ca1933cb9c1f6e68f7c"
    },
    {
      "path": "mux-mp4.js",
      "mode": "100644",
      "type": "blob",
      "sha": "cec03c67fa7c15539de7f7ee8a8ea8f87c23193b",
      "size": 213987,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/cec03c67fa7c15539de7f7ee8a8ea8f87c23193b"
    },
    {
      "path": "serviceWorker.js",
      "mode": "100644",
      "type": "blob",
      "sha": "584f90530796987191b5d8c72ae75ffdcb2e728b",
      "size": 7412,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/584f90530796987191b5d8c72ae75ffdcb2e728b"
    },
    {
      "path": "vue.js",
      "mode": "100644",
      "type": "blob",
      "sha": "5e6e987f09aa4fd94e2825d6b0e2f99d686e531a",
      "size": 341345,
      "url": "https://api.github.com/repos/Momo707577045/m3u8-downloader/git/blobs/5e6e987f09aa4fd94e2825d6b0e2f99d686e531a"
    }
  ],
  "truncated": false
}
```