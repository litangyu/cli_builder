#!/usr/bin/env zx
const versionName = '1.0.0'

console.log(chalk.blue(`Hi~ Welcome to this tool. VERSION: ${versionName}\n`))

let buildCompleted = false

let uniAppBuild = $`npm run build:h5`
for await (const line of uniAppBuild.stdout) {
	if (line.includes('DONE  Build complete.')) {
		buildCompleted = true
		break
	}
}

if (buildCompleted) {
	const projectName = await $`cat package.json | grep name | sed -r 's/name|[":, ]//g'`
	cd('./dist/build/')
	let date = await $`date "+%Y%m%d_%H%M%S"`
	await $`zip -q -r ${projectName}_h5_${date}.zip ./h5`
	await $`open .`	
}