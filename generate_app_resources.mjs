#!/usr/bin/env zx
const versionName = '0.0.1'

console.log(chalk.blue(`Hi~ Welcome to this tool. VERSION: ${versionName}\n`))
let projectName = await question('Which uni-app project do you want to generate offline pack resource? ')
let androidProjectDir = await question('What is the target Android project path? ')
cd(androidProjectDir)
console.log(chalk.green('Check PASS\n'))

let applicationModulePath = await question("What is the Application module name? ")
cd(`${androidProjectDir}/${applicationModulePath}`)
console.log(chalk.green('Check PASS\n'))

console.log(chalk.blue('Mission Started'))
console.log(chalk.blue('Building... Please wait amount.'))
let result = await $`cli publish --platform APP --type appResource --project ${projectName} | grep -o -E "[A-Za-z0-9\/\_\-]+\/\_\_UNI\_\_[A-Za-z0-9]+\/www"`
let publishAppResourceDir = await $`echo ${result} | tr -d '\n'`
cd(`${publishAppResourceDir}/..`)
publishAppResourceDir = await $`pwd`

let destDir = `${androidProjectDir}/${applicationModulePath}/src/main/assets/apps`
cd(destDir)
console.log(chalk.green('Check PASS\n'))

await $`rm -rf *`
await $`cp -r ${publishAppResourceDir} ./`

console.log(chalk.green('Mission Complete!'))

// TODO 检查是否是Android项目
// TODO 询问目标Module，默认app
// TODO 检查是否有目标Module
// TODO 检查是否存在 src/main/assets/apps 目录。如果有，检查是否与当前appId相同。
// TODO 如果appId相同，则删除已存在的dir并拷贝
// TODO 如果appId不相同，询问是否删除已存在的。如果是，则删除已存在的dir并拷贝。如果否，程序结束。
