# HBuilderX 版本适配指南

本文档描述如何适配不同版本的 HBuilderX。

## 当前支持版本

| HBuilderX 版本 | 测试日期 | 状态 |
|---------------|---------|------|
| 4.75 | 2026-04-13 | ✅ 完全支持 |

## 快速验证

如果你使用的 HBuilderX 版本不在支持列表中，运行以下命令验证兼容性：

```bash
npm test
```

如果所有测试通过，说明你的版本兼容。如果有测试失败，请按照下面的流程进行适配。

## 适配新版本流程

### Step 1: 收集 CLI 输出

在项目根目录创建临时收集脚本：

```bash
# 创建收集目录
mkdir -p /tmp/hbx-output

# 1. 用户信息（已登录状态）
cli user info 2>&1 > /tmp/hbx-output/user-info-logged-in.txt

# 2. 发布输出（替换 YOUR_PROJECT 为实际项目名）
cli publish --platform APP --type appResource --project YOUR_PROJECT 2>&1 > /tmp/hbx-output/publish-success.txt

# 3. 登录输出
cli user login --username YOUR_EMAIL --password YOUR_PASSWORD 2>&1 > /tmp/hbx-output/login-success.txt
```

### Step 2: 对比输出格式

```bash
# 查看新版本输出的关键字段
cat /tmp/hbx-output/publish-success.txt | grep -E "(导出成功|export end|path is|__UNI__)"
```

### Step 3: 更新 Fixtures

将收集的输出复制到 fixtures 目录：

```bash
# 备份旧版本
mv tests/fixtures/hbuilder-output tests/fixtures/hbuilder-output-4.75

# 创建新版本目录
mkdir -p tests/fixtures/hbuilder-output

# 复制新输出
cp /tmp/hbx-output/*.txt tests/fixtures/hbuilder-output/
```

### Step 4: 运行测试并修复

```bash
npm test
```

根据失败的测试，更新 `src/parser.js` 中的解析函数：

| 失败的测试 | 需要更新的函数 |
|-----------|--------------|
| extractNewFormatPath | 路径提取正则 |
| parseUserInfoOutput | 用户信息解析 |
| isHBuilderXConnected | 连接状态检测 |
| isBuildSuccess | 编译结果检测 |
| isLoginRequired | 登录需求检测 |

### Step 5: 更新元数据

编辑 `tests/fixtures/hbuilder-output/metadata.json`：

```json
{
  "hbuilderx_version": "X.XX",
  "tested_at": "YYYY-MM-DD",
  ...
}
```

### Step 6: 提交贡献

```bash
git add tests/fixtures/hbuilder-output/
git add src/parser.js
git commit -m "feat: add HBuilderX X.XX support"
```

## 输出格式参考

### 用户信息 (cli user info)

```
# 已登录
<用户名>
0:user info:OK

# 未登录

0:user info:OK

# HBuilderX 未运行
通道被关闭
# 或
连接已断开
```

### 发布输出 (cli publish)

```
# 新版本格式（英文）
Project <name> export end，the path is: <path>/unpackage/resources

# 新版本格式（中文）
项目 <name> 导出成功，路径为：<path>/unpackage/resources

# 旧版本格式
<path>/__UNI__<id>/www

# 编译失败
编译失败
# 或
Build failed

# 需要登录
此功能需要先登录
# 或
Please Login in!
```

### 登录输出 (cli user login)

```
# 成功
0:user login:OK

# 失败
<错误信息>
```

## 解析函数说明

| 函数 | 用途 | 关键字符串 |
|-----|------|-----------|
| `extractNewFormatPath` | 提取导出路径 | `导出成功，路径为：`, `export end，the path is:` |
| `extractOldFormatPath` | 提取旧版路径 | `__UNI__xxx/www` |
| `parseUserInfoOutput` | 解析用户信息 | `:user info:OK` |
| `isHBuilderXConnected` | 检测连接状态 | `通道被关闭`, `连接已断开` |
| `isBuildSuccess` | 检测编译结果 | `编译失败`, `Build failed` |
| `isLoginRequired` | 检测登录需求 | `此功能需要先登录`, `Please Login in!` |

## 常见问题

### Q: 测试全部失败怎么办？

A: 可能是 HBuilderX 输出格式发生了重大变化。请：
1. 检查 fixture 文件内容
2. 对比新旧版本输出差异
3. 更新 `src/parser.js` 中的正则表达式

### Q: 如何同时支持多个版本？

A: 在解析函数中使用 OR 逻辑匹配多种格式：

```javascript
// 同时支持新旧格式
const match = stdout.match(/(?:旧格式|新格式)/)
```

### Q: 如何报告兼容性问题？

A: 请在 GitHub Issues 中提供：
1. HBuilderX 版本号
2. CLI 输出样例
3. 失败的测试信息
