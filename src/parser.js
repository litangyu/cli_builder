/**
 * 解析 HBuilderX CLI 输出的纯函数
 */

/**
 * 清理 ANSI 转义码
 * @param {string} str - 包含 ANSI 码的字符串
 * @returns {string} 清理后的字符串
 */
export function stripAnsiCodes(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

/**
 * 从 HBuilderX CLI 输出中提取导出路径（新版格式）
 * @param {string} stdout - CLI 输出
 * @returns {{ matched: boolean, path: string|null, format: 'new'|null }}
 */
export function extractNewFormatPath(stdout) {
  if (typeof stdout !== 'string') {
    return { matched: false, path: null, format: null }
  }

  const pathMatch = stdout.match(/(?:导出成功，路径为：|export end，the path is: )([^\s\n]+)/i)
  if (pathMatch) {
    return {
      matched: true,
      path: stripAnsiCodes(pathMatch[1]).trim(),
      format: 'new'
    }
  }
  return { matched: false, path: null, format: null }
}

/**
 * 从 HBuilderX CLI 输出中提取导出路径（旧版格式）
 * @param {string} stdout - CLI 输出
 * @returns {{ matched: boolean, path: string|null }}
 */
export function extractOldFormatPath(stdout) {
  if (typeof stdout !== 'string') {
    return { matched: false, path: null }
  }

  const match = stdout.match(/([A-Za-z0-9\/_\-]+\/__UNI__[A-Za-z0-9]+\/www)/)
  if (match) {
    return { matched: true, path: match[1] }
  }
  return { matched: false, path: null }
}

/**
 * 在目录条目中查找 __UNI__xxx 目录
 * @param {string[]} entries - 目录条目列表
 * @returns {string|null}
 */
export function findUniDirectory(entries) {
  if (!Array.isArray(entries)) return null
  return entries.find(name => typeof name === 'string' && name.startsWith('__UNI__')) || null
}

/**
 * 解析 user info 输出，提取用户名
 * @param {string} output - CLI 输出
 * @returns {string|null} 用户名或 null
 */
export function parseUserInfoOutput(output) {
  if (!output || typeof output !== 'string') return null
  if (!output.includes(':user info:OK')) return null
  const lines = output.split('\n')
  const username = lines[0]?.trim()
  return username || null
}

/**
 * 检测 HBuilderX 是否连接
 * @param {string} output - CLI 输出
 * @returns {boolean}
 */
export function isHBuilderXConnected(output) {
  if (!output || typeof output !== 'string') return false
  return !output.includes('通道被关闭') && !output.includes('连接已断开')
}

/**
 * 检测编译是否成功
 * @param {string} stdout - CLI 输出
 * @returns {boolean}
 */
export function isBuildSuccess(stdout) {
  if (!stdout || typeof stdout !== 'string') return true
  return !stdout.includes('编译失败') && !stdout.includes('Build failed')
}

/**
 * 检测是否需要登录
 * @param {string} stdout - CLI 输出
 * @returns {boolean}
 */
export function isLoginRequired(stdout) {
  return stdout?.includes('此功能需要先登录') ?? false
}
