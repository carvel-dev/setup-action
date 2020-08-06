const shell = require('shelljs')

const apps = process.argv.slice(2)
if (apps.length < 1) {
  console.log('❌  Error: specify apps to check')
  process.exit(1)
}

for (app of apps) {
  if (!shell.which(app)) {
    console.log(`✅  Verified ${app} is not installed`)
  } else {
    console.log(`❌  Failure: expected ${app} to not be installed.`)
    process.exit(1)
  }
}
