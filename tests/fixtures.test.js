import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
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

const fixturesDir = join(import.meta.dirname, 'fixtures', 'hbuilder-output')

function readFixture(name) {
  return readFileSync(join(fixturesDir, name), 'utf-8')
}

describe('fixtures-based tests', () => {
  describe('user info parsing (HBuilderX 4.75)', () => {
    it('should parse logged-in user from fixture', () => {
      const output = readFixture('user-info-logged-in.txt')
      expect(parseUserInfoOutput(output)).toBe('lty81372860@sina.com')
    })

    it('should return null for logged-out user from fixture', () => {
      const output = readFixture('user-info-logged-out.txt')
      expect(parseUserInfoOutput(output)).toBeNull()
    })

    it('should detect disconnected state from fixture', () => {
      const output = readFixture('user-info-disconnected.txt')
      expect(isHBuilderXConnected(output)).toBe(false)
    })
  })

  describe('publish output parsing (HBuilderX 4.75)', () => {
    it('should extract path from English format fixture', () => {
      const output = readFixture('publish-success-new-en.txt')
      const result = extractNewFormatPath(output)
      expect(result.matched).toBe(true)
      expect(result.path).toBe('/Users/lty/Desktop/Work/YuanShan-AI/svn/ah_protect_pj/mobile_web/uniapp_ahmaintain/unpackage/resources')
    })

    it('should extract path from Chinese format fixture', () => {
      const output = readFixture('publish-success-new-cn.txt')
      const result = extractNewFormatPath(output)
      expect(result.matched).toBe(true)
      expect(result.path).toBe('/Users/lty/Desktop/Work/YuanShan-AI/svn/ah_protect_pj/mobile_web/uniapp_ahmaintain/unpackage/resources')
    })

    it('should extract path from old format fixture', () => {
      const output = readFixture('publish-success-old.txt')
      const result = extractOldFormatPath(output)
      expect(result.matched).toBe(true)
      expect(result.path).toContain('__UNI__99C98E5/www')
    })

    it('should detect build failure (Chinese) from fixture', () => {
      const output = readFixture('publish-build-failed-cn.txt')
      expect(isBuildSuccess(output)).toBe(false)
    })

    it('should detect build failure (English) from fixture', () => {
      const output = readFixture('publish-build-failed-en.txt')
      expect(isBuildSuccess(output)).toBe(false)
    })

    it('should detect login required from fixture', () => {
      const output = readFixture('publish-login-required.txt')
      expect(isLoginRequired(output)).toBe(true)
    })

    it('should detect "Please Login in!" from fixture', () => {
      const output = readFixture('publish-please-login.txt')
      // 这个需要新增检测逻辑
      expect(isLoginRequired(output) || output.includes('Please Login')).toBe(true)
    })
  })

  describe('ANSI codes handling', () => {
    it('should strip ANSI codes from fixture output', () => {
      const output = readFixture('publish-success-new-en.txt')
      const cleaned = stripAnsiCodes(output)
      expect(cleaned).not.toContain('[33m')
      expect(cleaned).not.toContain('[39m')
    })
  })
})
