const shell = require('shelljs')

if (process.argv.length != 4) {
  console.log ('❌  Error: command and expected output must be given')
  process.exit(1)
}

const command = process.argv[2]
const expectedOutput = process.argv[3]

console.log(command)
console.log(expectedOutput)

const output = shell.exec(command, { silent: true }).stdout.trim()
if (output == expectedOutput) {
  console.log(`✅  Verified output from "${command}" was "${output}"`)
} else {
  console.log(`❌  Failure: expected output from "${command}" to be "${expectedOutput}", was "${output}"`)
  process.exit(1)
}
