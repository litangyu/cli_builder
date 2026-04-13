import { describe, it, expect } from 'vitest'
import {
  stripAnsiCodes,
  extractNewFormatPath,
  extractOldFormatPath,
  findUniDirectory,
  parseUserInfoOutput,
  isHBuilderXConnected,
  isBuildSuccess,
  isLoginRequired
} from '../src/parser.js'

describe('stripAnsiCodes', () => {
  it('should remove ANSI escape codes', () => {
    expect(stripAnsiCodes('\x1b[32mgreen text\x1b[0m')).toBe('green text')
    expect(stripAnsiCodes('\x1b[1;31mred bold\x1b[0m')).toBe('red bold')
  })

  it('should handle strings without ANSI codes', () => {
    expect(stripAnsiCodes('plain text')).toBe('plain text')
  })

  it('should handle non-string input', () => {
    expect(stripAnsiCodes(null)).toBe('')
    expect(stripAnsiCodes(undefined)).toBe('')
    expect(stripAnsiCodes(123)).toBe('')
  })
})

describe('extractNewFormatPath', () => {
  it('should extract path from Chinese format', () => {
    const stdout = '项目 myapp 导出成功，路径为：/Users/test/unpackage/resources'
    const result = extractNewFormatPath(stdout)
    expect(result.matched).toBe(true)
    expect(result.path).toBe('/Users/test/unpackage/resources')
    expect(result.format).toBe('new')
  })

  it('should extract path from English format', () => {
    const stdout = 'Project myapp export end，the path is: /Users/test/unpackage/resources'
    const result = extractNewFormatPath(stdout)
    expect(result.matched).toBe(true)
    expect(result.path).toBe('/Users/test/unpackage/resources')
    expect(result.format).toBe('new')
  })

  it('should strip ANSI codes from extracted path', () => {
    const stdout = '导出成功，路径为：\x1b[32m/Users/test/resources\x1b[0m'
    const result = extractNewFormatPath(stdout)
    expect(result.path).toBe('/Users/test/resources')
  })

  it('should return false when no match', () => {
    const result = extractNewFormatPath('no path here')
    expect(result.matched).toBe(false)
    expect(result.path).toBeNull()
    expect(result.format).toBeNull()
  })

  it('should handle null/undefined input', () => {
    expect(extractNewFormatPath(null).matched).toBe(false)
    expect(extractNewFormatPath(undefined).matched).toBe(false)
  })
})

describe('extractOldFormatPath', () => {
  it('should extract __UNI__xxx/www path', () => {
    const stdout = '/Users/test/__UNI__ABC123/www'
    const result = extractOldFormatPath(stdout)
    expect(result.matched).toBe(true)
    expect(result.path).toBe('/Users/test/__UNI__ABC123/www')
  })

  it('should extract path from output containing other text', () => {
    const stdout = 'Build output: /path/to/__UNI__XYZ789/www done'
    const result = extractOldFormatPath(stdout)
    expect(result.matched).toBe(true)
    expect(result.path).toBe('/path/to/__UNI__XYZ789/www')
  })

  it('should return false when no match', () => {
    const result = extractOldFormatPath('no uni path here')
    expect(result.matched).toBe(false)
    expect(result.path).toBeNull()
  })

  it('should handle null/undefined input', () => {
    expect(extractOldFormatPath(null).matched).toBe(false)
    expect(extractOldFormatPath(undefined).matched).toBe(false)
  })
})

describe('findUniDirectory', () => {
  it('should find __UNI__ directory', () => {
    const entries = ['folder1', '__UNI__ABC123', 'folder2']
    expect(findUniDirectory(entries)).toBe('__UNI__ABC123')
  })

  it('should return null when not found', () => {
    const entries = ['folder1', 'folder2']
    expect(findUniDirectory(entries)).toBeNull()
  })

  it('should handle non-array input', () => {
    expect(findUniDirectory(null)).toBeNull()
    expect(findUniDirectory('string')).toBeNull()
    expect(findUniDirectory(undefined)).toBeNull()
  })
})

describe('parseUserInfoOutput', () => {
  it('should extract username from valid output', () => {
    const output = 'test@example.com\n0:user info:OK'
    expect(parseUserInfoOutput(output)).toBe('test@example.com')
  })

  it('should return null for empty output', () => {
    expect(parseUserInfoOutput('')).toBeNull()
    expect(parseUserInfoOutput('\n0:user info:OK')).toBeNull()
  })

  it('should return null for invalid output', () => {
    expect(parseUserInfoOutput('random text')).toBeNull()
    expect(parseUserInfoOutput(null)).toBeNull()
    expect(parseUserInfoOutput(undefined)).toBeNull()
  })
})

describe('isHBuilderXConnected', () => {
  it('should return false for disconnected messages', () => {
    expect(isHBuilderXConnected('通道被关闭')).toBe(false)
    expect(isHBuilderXConnected('连接已断开')).toBe(false)
  })

  it('should return true for normal output', () => {
    expect(isHBuilderXConnected('user info result')).toBe(true)
  })

  it('should return false for null/undefined', () => {
    expect(isHBuilderXConnected(null)).toBe(false)
    expect(isHBuilderXConnected(undefined)).toBe(false)
  })
})

describe('isBuildSuccess', () => {
  it('should return false for build failure', () => {
    expect(isBuildSuccess('编译失败: syntax error')).toBe(false)
    expect(isBuildSuccess('Build failed: error')).toBe(false)
  })

  it('should return true for successful build', () => {
    expect(isBuildSuccess('Build complete')).toBe(true)
    expect(isBuildSuccess('')).toBe(true)
    expect(isBuildSuccess(null)).toBe(true)
    expect(isBuildSuccess(undefined)).toBe(true)
  })
})

describe('isLoginRequired', () => {
  it('should detect login required message', () => {
    expect(isLoginRequired('此功能需要先登录')).toBe(true)
  })

  it('should return false for normal output', () => {
    expect(isLoginRequired('Build success')).toBe(false)
    expect(isLoginRequired(null)).toBe(false)
    expect(isLoginRequired(undefined)).toBe(false)
  })
})
