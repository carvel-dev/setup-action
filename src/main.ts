import {cache} from './adapters/cache'
import {core} from './adapters/core'
import {fs} from './adapters/fs'
import {Inputs} from './inputs'
import {ReleasesService} from './releases_service'
import {Installer} from './installer'
import {createOctokit} from './adapters/octokit'

async function run(): Promise<void> {
  const octokit = createOctokit()
  const releasesService = new ReleasesService(process, core, octokit)
  const installer = new Installer(core, cache, fs, process, releasesService)

  try {
    console.time('download apps')
    const apps = new Inputs(core, process).getAppsToDownload()
    await installer.installAll(apps)
    console.timeEnd('download apps')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
