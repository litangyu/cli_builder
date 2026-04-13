import { describe, it, expect } from 'vitest'
import { validateConfig } from '../src/config.js'

describe('validateConfig', () => {
  const validConfig = {
    project: 'my-project',
    android_project_path: '/Users/test/AndroidProject',
    android_application_module_path: 'app',
    dcloud_username: 'test@example.com',
    dcloud_password: 'password123',
    version_info_file_path: './src/main.ts',
    node_package_json_file_path: './package.json'
  }

  it('should pass for valid config', () => {
    const result = validateConfig(validConfig)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail for missing required fields', () => {
    const result = validateConfig({})
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.field === 'project')).toBe(true)
    expect(result.errors.some(e => e.field === 'android_project_path')).toBe(true)
    expect(result.errors.some(e => e.field === 'android_application_module_path')).toBe(true)
    expect(result.errors.some(e => e.field === 'version_info_file_path')).toBe(true)
    expect(result.errors.some(e => e.field === 'node_package_json_file_path')).toBe(true)
  })

  it('should fail for non-absolute android_project_path', () => {
    const result = validateConfig({
      ...validConfig,
      android_project_path: 'relative/path'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.find(e => e.field === 'android_project_path')?.error)
      .toBe('Must be absolute path')
  })

  it('should fail for invalid module name', () => {
    const result = validateConfig({
      ...validConfig,
      android_application_module_path: '123invalid'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.find(e => e.field === 'android_application_module_path')?.error)
      .toBe('Invalid module name format')
  })

  it('should allow optional fields to be missing', () => {
    const { dcloud_username, dcloud_password, ...requiredOnly } = validConfig
    const result = validateConfig(requiredOnly)
    expect(result.valid).toBe(true)
  })

  it('should fail for invalid email format', () => {
    const result = validateConfig({
      ...validConfig,
      dcloud_username: 'invalid-email'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.find(e => e.field === 'dcloud_username')?.error)
      .toBe('Invalid email format')
  })

  it('should fail for empty required string', () => {
    const result = validateConfig({
      ...validConfig,
      project: ''
    })
    expect(result.valid).toBe(false)
    expect(result.errors.find(e => e.field === 'project')?.error)
      .toBe('Required field is empty')
  })

  it('should handle null/undefined input', () => {
    expect(validateConfig(null).valid).toBe(false)
    expect(validateConfig(undefined).valid).toBe(false)
  })
})
