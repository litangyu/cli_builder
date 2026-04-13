#!/usr/bin/env zx
import {
  stripAnsiCodes,
  extractNewFormatPath,
  extractOldFormatPath,
  findUniDirectory,
  parseUserInfoOutput,
  isHBuilderXConnected,
  isBuildSuccess,
  isLoginRequired
} from './src/parser.js'
import { validateConfig } from './src/config.js'

const versionName = '1.2.0'

console.log(chalk.blue(`Hi~ Welcome to this tool. VERSION: ${versionName}\n`))

// ============ 工具函数 ============

/**
 * 延时函数
 * @param {number} ms - 延时毫秒数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 检测 HBuilderX 是否运行
 * 通过尝试执行 cli user info 命令判断
 * @returns {Promise<boolean>}
 */
async function isHBuilderXRunning() {
  try {
    const result = await $`cli user info 2>&1`.quiet()
    const output = result.stdout.trim()
    return isHBuilderXConnected(output) && result.exitCode === 0 && output.length > 0
  } catch {
    return false
  }
}

/**
 * 获取当前登录的 DCloud 用户名
 * @returns {Promise<string|null>} 用户名或 null（未登录）
 */
async function getLoginUser() {
  try {
    const result = await $`cli user info 2>&1`.quiet()
    const output = result.stdout.trim()
    return parseUserInfoOutput(output)
  } catch {
    return null
  }
}

/**
 * 确保 HBuilderX 正在运行，如未运行则自动启动
 * @param {object} options - 配置选项
 * @param {number} options.timeout - 超时时间（毫秒），默认 60000
 * @param {number} options.interval - 轮询间隔（毫秒），默认 2000
 * @returns {Promise<boolean>}
 * @throws {Error} 启动超时时抛出错误
 */
async function ensureHBuilderXRunning(options = {}) {
  const { timeout = 60000, interval = 2000 } = options

  if (await isHBuilderXRunning()) {
    console.log(chalk.green('✓ HBuilderX 已运行'))
    return true
  }

  console.log(chalk.yellow('正在启动 HBuilderX...'))
  await $`cli open`.quiet()

  // 轮询等待就绪
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    await sleep(interval)
    if (await isHBuilderXRunning()) {
      console.log(chalk.green('✓ HBuilderX 已就绪'))
      return true
    }
  }

  throw new Error('HBuilderX 启动超时，请手动启动后重试')
}

/**
 * 强制重新登录 DCloud 账号
 * @param {string} username - DCloud 用户名
 * @param {string} password - DCloud 密码
 * @returns {Promise<boolean>}
 * @throws {Error} 登录失败时抛出错误
 */
async function forceLogin(username, password) {
  if (!username || !password) {
    throw new Error('配置文件中缺少 dcloud_username 或 dcloud_password')
  }

  console.log(chalk.yellow('正在重新登录 DCloud 账号...'))

  // 先登出
  try {
    await $`cli user logout 2>&1`.quiet()
    await sleep(1000)
  } catch {
    // 忽略登出错误
  }

  // 再登录
  const loginResult = await $`cli user login --username ${username} --password ${password} 2>&1`.quiet()

  if (loginResult.stdout.includes(':user login:OK')) {
    console.log(chalk.green('✓ 登录成功'))
    return true
  }

  throw new Error(`DCloud 账号登录失败: ${loginResult.stdout.trim()}`)
}

/**
 * 确保 DCloud 账号已登录，如未登录则使用配置中的凭据自动登录
 * @param {string} username - DCloud 用户名
 * @param {string} password - DCloud 密码
 * @returns {Promise<boolean>}
 * @throws {Error} 登录失败时抛出错误
 */
async function ensureLoggedIn(username, password) {
  const currentUser = await getLoginUser()

  if (currentUser) {
    console.log(chalk.green(`✓ 已登录 DCloud 账号: ${currentUser}`))
    return true
  }

  if (!username || !password) {
    throw new Error('未检测到登录状态，且配置文件中缺少 dcloud_username 或 dcloud_password')
  }

  console.log(chalk.yellow('正在登录 DCloud 账号...'))
  const loginResult = await $`cli user login --username ${username} --password ${password} 2>&1`.quiet()

  if (loginResult.stdout.includes(':user login:OK')) {
    console.log(chalk.green('✓ 登录成功'))
    return true
  }

  throw new Error(`DCloud 账号登录失败: ${loginResult.stdout.trim()}`)
}

// ============ 主流程 ============

async function main() {
  try {
    // 1. 确保 HBuilderX 运行
    await ensureHBuilderXRunning()

    let projectName, androidProjectDir, androidApplicationModulePath, dCloudUsername, dCloudPassword, versionInfoFilePath, nodePackageJsonFilePath

    // 获取提交次数
    const commitCount = await $`git rev-list --count HEAD`
    // 获取最新的tag信息（包含dirty标记）
    const latestTag = await $`git describe --tags --dirty`

    // If cliconfig.json is exists. Read parameter from it. Otherwise request user input.
    const configExists = await fs.exists('./cliconfig.json')
    if (configExists) {
      console.log('Using configured parameters from "cliconfig.json"')
      const config = await fs.readJson('./cliconfig.json')

      // 验证配置
      const validation = validateConfig(config)
      if (!validation.valid) {
        throw new Error(`配置验证失败:\n${validation.errors.map(e => `  - ${e.field}: ${e.error}`).join('\n')}`)
      }

      projectName = config.project
      androidProjectDir = config.android_project_path
      androidApplicationModulePath = config.android_application_module_path
      dCloudUsername = config.dcloud_username
      dCloudPassword = config.dcloud_password
      versionInfoFilePath = config.version_info_file_path
      nodePackageJsonFilePath = config.node_package_json_file_path
    } else {
      projectName = await question('Which uni-app project do you want to generate offline pack resource? ')
      androidProjectDir = await question('What is the target Android project path? ')
      androidApplicationModulePath = await question("What is the Application module name? ")
      dCloudUsername = await question("DCloud account user name? ")
      dCloudPassword = await question("DCloud account password? ")
      versionInfoFilePath = await question("Target file path for replace version info by git?")
      nodePackageJsonFilePath = await question("'package.json' path for replace version info by git?")
    }

    // 2. 确保已登录 DCloud 账号
    await ensureLoggedIn(dCloudUsername, dCloudPassword)

    // Replace version info
    await $`sed -i '' "s/export const version_name = .*/export const version_name = '${latestTag}'/g" ${versionInfoFilePath}`
    await $`sed -i '' "s/export const version_code = .*/export const version_code = ${commitCount}/g" ${versionInfoFilePath}`
    // Also replace in 'package.json'
    await $`sed -i '' "s/\\"version\\": \\".*\\"/\\"version\\": \\"${latestTag}\\"/g" ${nodePackageJsonFilePath}`

    // Check Android project dir
    cd(androidProjectDir)
    console.log(chalk.green('Check PASS\n'))
    cd(`${androidProjectDir}/${androidApplicationModulePath}`)
    console.log(chalk.green('Check PASS\n'))

    console.log(chalk.blue('Mission Started'))
    console.log(chalk.blue('Building... Please wait amount.'))

    // TODO Check project has been opened in HBuilderX

    // Use 'HBuilderX' generate app resource
    // 先执行 publish 命令，检测是否需要重新登录
    let publishOutput = await $`cli publish --platform APP --type appResource --project ${projectName} 2>&1`

    // 如果提示需要登录，强制重新登录后重试
    if (isLoginRequired(publishOutput.stdout)) {
      console.log(chalk.yellow('检测到登录状态失效，正在重新登录...'))
      await forceLogin(dCloudUsername, dCloudPassword)
      await sleep(2000)
      publishOutput = await $`cli publish --platform APP --type appResource --project ${projectName} 2>&1`
    }

    // 检查编译是否失败
    if (!isBuildSuccess(publishOutput.stdout)) {
      throw new Error(`项目编译失败:\n${publishOutput.stdout}`)
    }

    // 提取导出路径 - 兼容新旧版本输出格式
    let publishAppResourceDir = null

    // 尝试匹配新版本格式
    const newPathResult = extractNewFormatPath(publishOutput.stdout)
    if (newPathResult.matched) {
      const resourcesDir = newPathResult.path
      console.log(chalk.green(`✓ 检测到导出路径: ${resourcesDir}`))
      // 新版本路径指向 resources 目录，需要找到其中的 __UNI__xxx 子目录
      const entries = await fs.readdir(resourcesDir)
      const uniDir = findUniDirectory(entries)
      if (!uniDir) {
        throw new Error(`在 ${resourcesDir} 中未找到 __UNI__xxx 目录`)
      }
      publishAppResourceDir = `${resourcesDir}/${uniDir}`
    } else {
      // 尝试匹配旧版本格式
      const oldPathResult = extractOldFormatPath(publishOutput.stdout)
      if (!oldPathResult.matched) {
        throw new Error(`未找到导出路径，publish 输出:\n${publishOutput.stdout}`)
      }
      publishAppResourceDir = oldPathResult.path
      cd(`${publishAppResourceDir}/..`)
      publishAppResourceDir = await $`pwd`
    }

    // 验证目录存在
    if (!await fs.exists(publishAppResourceDir)) {
      throw new Error(`导出目录不存在: ${publishAppResourceDir}`)
    }

    // Check apps assets folder exists
    let destDir = `${androidProjectDir}/${androidApplicationModulePath}/src/main/assets/apps`
    cd(destDir)
    console.log(chalk.green('Check PASS\n'))

    // Delete old files and copy new ones
    await $`rm -rf *`
    await $`cp -r ${publishAppResourceDir} ./`

    // Use script 'gradlew' assemble build type release apk
    cd(androidProjectDir)
    await $`./gradlew assembleRelease --no-daemon --stacktrace`

    console.log(chalk.green('Mission Complete!'))
    // Open outputs folder
    await $`open ${androidApplicationModulePath}/build/outputs/apk/`

  } catch (error) {
    console.error(chalk.red('✗ 执行失败'))
    console.error(chalk.red(error.message))
    process.exit(1)
  }
}

// 启动主流程
main()
