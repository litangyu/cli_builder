import path from 'path'

/**
 * 配置验证规则
 */
const CONFIG_SCHEMA = {
  project: {
    type: 'string',
    required: true,
    validate: (v) => v.length > 0 || 'Required field is empty'
  },
  android_project_path: {
    type: 'string',
    required: true,
    validate: (v) => path.isAbsolute(v) || 'Must be absolute path'
  },
  android_application_module_path: {
    type: 'string',
    required: true,
    pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    validate: (v, rules) => rules.pattern.test(v) || 'Invalid module name format'
  },
  version_info_file_path: {
    type: 'string',
    required: true,
    validate: (v) => v.length > 0 || 'Required field is empty'
  },
  node_package_json_file_path: {
    type: 'string',
    required: true,
    validate: (v) => v.length > 0 || 'Required field is empty'
  },
  dcloud_username: {
    type: 'string',
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validate: (v, rules) => rules.pattern.test(v) || 'Invalid email format'
  },
  dcloud_password: {
    type: 'string',
    required: false
  }
}

/**
 * 验证配置对象
 * @param {object} config - 配置对象
 * @returns {{ valid: boolean, errors: Array<{field: string, error: string}> }}
 */
export function validateConfig(config) {
  const errors = []

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: [{ field: '', error: 'Config must be an object' }] }
  }

  for (const [key, rules] of Object.entries(CONFIG_SCHEMA)) {
    const value = config[key]

    // Required check
    if (rules.required && (value === undefined || value === null)) {
      errors.push({ field: key, error: 'Required field is missing' })
      continue
    }

    // Skip further validation if field is not provided and not required
    if (value === undefined || value === null) continue

    // Type check
    if (rules.type && typeof value !== rules.type) {
      errors.push({ field: key, error: `Expected ${rules.type}, got ${typeof value}` })
      continue
    }

    // Custom validation
    if (rules.validate) {
      const result = rules.validate(value, rules)
      if (result !== true) {
        errors.push({ field: key, error: result })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
