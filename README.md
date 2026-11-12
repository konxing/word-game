# 打字小站 · Word Game

一款适合电脑零基础成年人的中文离线打字游戏：22 关循序渐进，提供半透明写实双手、按键与指尖指引、拼音/中文句子练习。**不需要账号、不限时、不联网。**

## 下载 Windows 程序（推荐）

**[下载最新 Windows EXE（GitHub Releases）](https://github.com/konxing/word-game/releases/latest)**

1. 打开上面的链接，在 **Assets** 下下载 `打字小站.exe`。
2. 双击 `打字小站.exe` 即可运行（Windows 10/11 64 位）。
3. 如需桌面图标，请右键 EXE → **发送到 → 桌面快捷方式**。之后双击图标就能练习。

> 不用下载 `Code → Download ZIP` 来安装游戏。GitHub 仓库中的 `*.go`、`*.js` 等是开发用源代码；真正给使用者下载的程序在 **Releases**。旧的 `开始练习.cmd` 与 `安装到桌面.cmd` 已不再作为发布入口。

这是一个真正的 Windows GUI EXE（Go 编译），内置网页游戏和透明手型资源，不会弹出命令行窗口。它使用电脑现有的 **Microsoft Edge 或 Google Chrome** 显示独立窗口；**运行游戏不联网**，但电脑必须已有其中一种浏览器。不必安装 Go、Node.js 或 Python。

### 进度与更新

每次启动时，程序会将内置资源更新到 `%LOCALAPPDATA%\TypingHarbor\App`，浏览器配置与进度保存在 `%LOCALAPPDATA%\TypingHarbor\BrowserProfile`，更新 EXE 不主动清除旧记录。此前使用旧版桌面快捷方式的用户通常可以沿用相同进度；直接双击 `index.html` 使用普通浏览器产生的记录不一定互通。

不要随意删除 BrowserProfile 文件夹，否则可能丢失学习进度。

## 如何练习

打开程序 → 点击“开始轻松练习” → 看目标键与透明双手示意 → 用实物键盘按键。按错可重试，没有倒计时。默认只练 6 个键或一句短中文；用户可自愿选择完整练习。

- **第 1–10 关**：从 F/J 基准键开始，认识左右手、数字、空格、回车以及其他字母。
- **第 11–12 关**：输入常见拼音，熟悉拼音键位。
- **第 13–22 关**：生活化中文短句与较长句子；每个汉字上方都有对应拼音。
- 练习时目标键高亮，键盘上展示自然姿势的透明双手；目标手指以克制的指尖光圈和辅助引导线提示，不把手指强行拉伸成奇怪形状。

中文输入法是 Windows 自带功能，常用 `Win + 空格` 切换输入法；不同拼音输入法选字流程可能不同，游戏的指法引导只作参考。

## 源代码与可复现构建

游戏：原生 HTML/CSS/JavaScript；启动器：Go 1.23；全部资源通过 `embed` 打包到 EXE。没有网络 API 调用，练习记录只保存在本地。

```bash
node --test tests/*.test.cjs
go test ./...
```

Windows PowerShell 构建：

```powershell
go build -trimpath -ldflags="-s -w -H windowsgui" -o 'dist/打字小站.exe' .
```

GitHub Actions 在 `main` 每次更新时自动测试、编译、上传构建产物，并发布带有 `打字小站.exe` 的 GitHub Release。建议从 **Releases → Latest** 下载，而不是从 Actions 取有保留期限的临时构建产物。

心理学设计依据见 [学习设计说明](docs/LEARNING-DESIGN.md)。这些方法有理论支持，但本项目尚未做正式的中年成人效果实验。

## 许可证

MIT。
