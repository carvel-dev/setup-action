const shell = require('shelljs')

if (process.argv.length != 4) {
  console.log ('❌  Error: app name and version required')
  process.exit(1)
}

const app = process.argv[2]
const version = process.argv[3]

const info = shell.exec(`${app} version`, { silent: true }).stdout.trim()
if (info == `${app} version ${version}`) {
  console.log(`✅  Verified ${app} version is ${version}`)
} else {
  console.log(`❌  Failure: expected ${app} version to be ${version}, found "${info}"`)
  process.exit(1)
}
