# Pharos

Pharos 是一个用于 Ghost 博客程序的主题皮肤，适合个人写作和摄影内容展示。
它最初基于 Journal Ghost theme，并在当前项目中持续做了现代化调整。

演示站点：<https://yuanliang.io>

## 主题特性

- 双栏文章布局，左侧大面积封面展示
- 独立摄影模板：`custom-photo.hbs`
- 阅读模式与作品浏览模式
- 图片信息优先读取手写说明，其次回退到 EXIF
- 主题静态资源本地化，包括字体、搜索样式和脚本
- 代码高亮按需加载，不在所有页面全量引入

## 摄影文章说明

当一篇文章需要按摄影作品展示时，请使用 `custom-photo` 模板。

- 只有摄影文章才会显示“作品”入口
- 只有带有效图片信息的图片才会进入作品浏览
- 图片满足以下任一条件即可进入作品集：
  - 有 `alt` 文本
  - 原图中可读取到 EXIF 信息

## 运行要求

- Ghost 5.x 或 6.x
- 当前本地已在 Ghost 6.22.0 下验证
- 只有在重新编译样式时才需要 Node.js

## 安装方式

1. 将主题放到 `content/themes/ghost-theme-pharos-master-2`
2. 如有需要，重启 Ghost
3. 在 Ghost 后台启用 `Pharos`
4. 如果文章需要使用摄影展示模式，在文章设置中选择 `custom-photo` 模板

## 开发命令

安装依赖：

```bash
npm install
```

编译运行时样式：

```bash
npm run style
```

编译基础主题样式：

```bash
npm run style:base
```

清理运行时生成的 CSS：

```bash
npm run clean
```

## 目录说明

- `default.hbs`：全局布局和资源加载入口
- `post.hbs`：普通文章模板
- `custom-photo.hbs`：摄影文章模板
- `partials/post-cover.hbs`：文章封面区域
- `partials/post-main.hbs`：文章正文和元信息
- `partials/photo-experience.hbs`：作品浏览层和图片信息容器
- `partials/code-assets.hbs`：代码高亮按需加载逻辑
- `assets/javascripts/pharos.js`：主题交互脚本
- `assets/stylesheets/pharos.runtime.less`：运行时样式覆盖

## 致谢

- 原始基础主题：Journal Ghost theme
- 当前定制与维护：Yuan Liang

## 许可证

MIT
