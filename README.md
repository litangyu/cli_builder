# uni-app-porter

This tool helps you generate uni-app offline packaged app resources and copy them to a specified Android project.

帮助你生成 Uni-App 本地打包 App 资源并拷贝至指定 Android 项目中。

Powered by [google/zx](https://github.com/google/zx)

## Requirements

- **HBuilderX 4.75** (tested version)
- Node.js
- zx (`npm i -g zx`)

> **Other HBuilderX versions?** See [HBuilderX Compatibility Guide](docs/HBUILDERX_COMPATIBILITY.md) for adapting to different versions.

## Installation

```bash
npm i -g zx
```

## Configuration

Add HBuilderX CLI to your terminal environment:

```bash
# HBuilderX CLI
export PATH=${PATH}:/Applications/HBuilderX.app/Contents/MacOS/
```

## Usage

### Option 1: Interactive Mode

Run the script and answer the prompts:

```bash
zx generate_app.mjs
```

### Option 2: Configuration File

Create a `cliconfig.json` in your uni-app project root:

```json
{
  "project": "your-project-name",
  "android_project_path": "/path/to/android/project",
  "android_application_module_path": "app",
  "dcloud_username": "your-dcloud-email@example.com",
  "dcloud_password": "your-password",
  "version_info_file_path": "./src/main.ts",
  "node_package_json_file_path": "./package.json"
}
```

Then run:

```bash
zx generate_app.mjs
```

## Features

- Auto-start HBuilderX if not running
- Auto-login DCloud account
- Version info replacement from git tags
- Compatible with HBuilderX CLI output formats (Chinese/English)

## Output

The script will:
1. Build uni-app app resources
2. Copy `__UNI__xxx` folder to `{android_project}/app/src/main/assets/apps/`
3. Build release APK via Gradle
4. Open the output folder

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Contributing

If you're using a different HBuilderX version, please refer to [HBuilderX Compatibility Guide](docs/HBUILDERX_COMPATIBILITY.md) for instructions on adapting and contributing support for new versions.
