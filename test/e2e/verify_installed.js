const shell = require('shelljs')

const apps = process.argv.slice(2)
if (apps.length < 1) {
  console.log('❌  Error: specify apps to check')
  process.exit(1)
}

for (app of apps) {
  if (shell.which(app)) {
    console.log(`✅  Verified ${app} is installed`)
  } else {
    console.log(`❌  Failure: ${app} is not installed`)
    process.exit(1)
  }
}
