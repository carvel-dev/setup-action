import {
  GitHubReleasesService,
  Octokit,
  AppInfo,
  ReposListReleasesParameters,
  DownloadInfo,
  GitHubDownloadMeta
} from '@jbrunton/gha-installer'
import {
  ActionsCore,
  Environment,
  FileSystem
} from '@jbrunton/gha-installer/lib/interfaces'
import * as crypto from 'crypto'
import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'

export class CarvelReleasesService extends GitHubReleasesService {
  private _fs: FileSystem

  constructor(
    core: ActionsCore,
    env: Environment,
    fs: FileSystem,
    octokit: Octokit
  ) {
    super(core, env, octokit, {repo: getRepo, assetName: getAssetName})
    this._fs = fs
  }

  onFileDownloaded(
    path: string,
    info: DownloadInfo<GitHubDownloadMeta>,
    core: ActionsCore
  ): void {
    this.verifyChecksum(path, info, core)
  }

  private verifyChecksum(
    downloadPath: string,
    info: DownloadInfo<GitHubDownloadMeta>,
    core: ActionsCore
  ) {
    const digest = this.computeDigest(downloadPath)
    const assetName = path.basename(info.url)
    const expectedChecksum = `${digest}  ./${assetName}`
    const releaseNotes = info.meta.release.body
    if (releaseNotes && releaseNotes.includes(expectedChecksum)) {
      core.info(`✅  Verified checksum: "${expectedChecksum}"`)
    } else {
      throw new Error(
        `Unable to verify checksum for ${assetName}. Expected to find "${expectedChecksum}" in release notes.`
      )
    }
  }

  private computeDigest(downloadPath: string): string {
    const data = this._fs.readFileSync(downloadPath)
    const digest = crypto.createHash('sha256').update(data).digest('hex')
    return digest
  }

  static create(octokit: Octokit): CarvelReleasesService {
    return new CarvelReleasesService(core, process, fs, octokit)
  }
}

export function getRepo(app: AppInfo): ReposListReleasesParameters {
  return {
    owner: 'carvel-dev',
    repo: getRepoName(app)
  }
}

function getRepoName(app: AppInfo): string {
  if (app.name === 'kctrl') {
    return 'carvel-kapp-controller'
  }
  return `carvel-${app.name}`
}

export function getAssetName(platform: string, app: AppInfo): string {
  return `${app.name}-${getAssetSuffix(platform)}`
}

function getAssetSuffix(platform: string): string {
  switch (platform) {
    case 'win32':
      return 'windows-amd64.exe'
    case 'darwin':
      return 'darwin-amd64'
    default:
      return 'linux-amd64'
  }
}
