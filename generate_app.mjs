#!/usr/bin/env zx
const versionName = '1.0.2'

console.log(chalk.blue(`Hi~ Welcome to this tool. VERSION: ${versionName}.\n`))
console.log(chalk.blue(`Currently we just support @dcloudio/uni-app '3.0.0-4020420240722002' and above. For versions lower than this, please use the 1.0.0 version of this tool.\n`))

await $`cli open`.quiet()
// // Check 'HBuilderX' is running, if not, open it.
// try {
//   await $`ps -ef | grep HBuilderX | grep -v "grep" | wc -l | awk '{print $1}'`.quiet()
// } catch (processOutput) {
  
// }

let projectName, androidProjectDir, androidApplicationModulePath, dCloudUsername, dCloudPassword, versionInfoFilePath, nodePackageJsonFilePath

// 获取提交次数
const commitCount = await $`git rev-list --count HEAD`
// 获取最新的tag信息（包含dirty标记）
const latestTag = await $`git describe --tags --dirty`

// If cliconfig.json is exists. Read parameter from it. Otherwise request user input.
const configExists = await fs.exists('./cliconfig.json')
if (configExists) {
  console.log('Using configured parameters from "cliconfig.json"')
  const { project, android_project_path, android_application_module_path, dcloud_username, dcloud_password, version_info_file_path, node_package_json_file_path } = await fs.readJson('./cliconfig.json')
  projectName = project
  androidProjectDir = android_project_path
  androidApplicationModulePath = android_application_module_path
  dCloudUsername = dcloud_username
  dCloudPassword = dcloud_password
  versionInfoFilePath = version_info_file_path
  nodePackageJsonFilePath = node_package_json_file_path
} else {
  projectName = await question('Which uni-app project do you want to generate offline pack resource? ')
  androidProjectDir = await question('What is the target Android project path? ')
  androidApplicationModulePath = await question("What is the Application module name? ")
  dCloudUsername = await question("DCloud account user name? ")
  dCloudPassword = await question("DCloud account password? ")
  versionInfoFilePath = await question("Target file path for replace version info by git?")
  nodePackageJsonFilePath = await question("'package.json' path for replace version info by git?")
}
// Replace version info
await $`sed -i '' "s/export const version_name = .*/export const version_name = '${latestTag}'/g" ${versionInfoFilePath}`
await $`sed -i '' "s/export const version_code = .*/export const version_code = ${commitCount}/g" ${versionInfoFilePath}`
// Also replace in 'package.json'
await $`sed -i '' "s/\\"version\\": \\".*\\"/\\"version\\": \\"${latestTag}\\"/g" ${nodePackageJsonFilePath}`

// Check 'HBuilderX' is already login account. If not. Use parameter login.
const currentUsername = await $`cli user info | awk 'NR==1{print}'`.quiet()
if (currentUsername.stdout === '\n') {
  console.log('Login required.')
  if (!configExists) {
    dCloudUsername = await question('Please input your dcloud.io username: ')
    dCloudPassword = await question('Please input your dcloud.io password: ')
  }
  await $`cli user login --username ${dCloudUsername} --password ${dCloudPassword}`.quiet()
}
console.log('HBuilderX already log in.')

// Check Android project dir
cd(androidProjectDir)
console.log(chalk.green('Check PASS\n'))
cd(`${androidProjectDir}/${androidApplicationModulePath}`)
console.log(chalk.green('Check PASS\n'))

console.log(chalk.blue('Mission Started'))
console.log(chalk.blue('Building... Please wait amount.'))

// TODO Check project has been opened in HBuilderX

// Use 'HBuilderX' generate app resource
// let path = await $`cli publish --platform APP --type appResource --project ${projectName} | grep -o -E "导出成功，路径为：" | sed -E "s/导出成功，路径为：//g" | tr -d "\\\n"`
// 执行命令并获取输出
let output = await $`cli publish --platform APP --type appResource --project ${projectName}`;

// 获取标准输出
let stdout = output.stdout;

// 清理 ANSI 转义序列和控制字符
stdout = stdout.replace(/\x1B\[[0-9;]*m/g, '');

// 使用正则表达式提取路径
const match = stdout.match(/(?:导出成功，路径为：|the path is:)\s*([^\n\r]+)/);
let path = match ? match[1].trim() : '';
let publishAppResourceDir = ""
if (path) {
    console.log(`提取的路径为: ${path}`);
    publishAppResourceDir = path
} else {
    console.log("未找到导出路径");
}

console.log(chalk.green('Genarate app resource PASS. Export path: ' + path + '\n'))

cd(`${publishAppResourceDir}`)
publishAppResourceDir = await $`pwd`

// Check apps assets folder exists
let destDir = `${androidProjectDir}/${androidApplicationModulePath}/src/main/assets/apps`
cd(destDir)
console.log(chalk.green('Check PASS\n'))

// Delete old files and copy new ones
await $`rm -rf *`
await $`cp -r ${publishAppResourceDir}/* ./`

// Use script 'gradlew' assemble build type release apk
cd(androidProjectDir)
await $`./gradlew assembleRelease --no-daemon --stacktrace`

console.log(chalk.green('Mission Complete!'))
// Open outputs folder
await $`open ${androidApplicationModulePath}/build/outputs/apk/`

// TODO 检查是否是Android项目
// TODO 询问目标Module，默认app
// TODO 检查是否有目标Module
// TODO 检查是否存在 src/main/assets/apps 目录。如果有，检查是否与当前appId相同。
// TODO 如果appId相同，则删除已存在的dir并拷贝
// TODO 如果appId不相同，询问是否删除已存在的。如果是，则删除已存在的dir并拷贝。如果否，程序结束。
