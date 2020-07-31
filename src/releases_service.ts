import {
  GitHubReleasesService,
  Octokit,
  AppInfo,
  ReposListReleasesParameters,
  GitHubDownloadInfo,
  DownloadInfo
} from '@jbrunton/gha-installer'
import {ActionsCore, Environment} from '@jbrunton/gha-installer/lib/interfaces'
import {ReposListReleasesItem} from '@jbrunton/gha-installer/lib/octokit'
import {FileSystem} from './interfaces'
import * as crypto from 'crypto'
import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'

export class ReleasesService extends GitHubReleasesService {
  private _fs: FileSystem
  // for each downloaded file, a map from browser_download_url to the release data itself
  private _downloadedFiles: Map<string, ReposListReleasesItem>

  constructor(
    core: ActionsCore,
    env: Environment,
    fs: FileSystem,
    octokit: Octokit
  ) {
    super(core, env, octokit, getRepo, getAssetName)
    this._fs = fs
    this._downloadedFiles = new Map<string, ReposListReleasesItem>()
  }

  getDownloadInfo(app: AppInfo): Promise<GitHubDownloadInfo> {
    return super.getDownloadInfo(app).then(info => {
      this._downloadedFiles.set(info.url, info.release)
      return info
    })
  }

  onFileDownloaded(path: string, info: DownloadInfo, core: ActionsCore): void {
    const release = this._downloadedFiles.get(info.url)
    if (release == undefined) {
      throw new Error(`Unable to find release information for ${info.url}`)
    }
    this.verifyChecksum(path, info, release, core)
  }

  private verifyChecksum(
    downloadPath: string,
    info: DownloadInfo,
    release: ReposListReleasesItem,
    core: ActionsCore
  ) {
    const data = this._fs.readFileSync(downloadPath)
    const assetName = path.basename(info.url)
    const digest = crypto.createHash('sha256').update(data).digest('hex')
    const expectedChecksum = `${digest}  ./${assetName}`
    if (release.body.includes(expectedChecksum)) {
      core.info(`✅  Verified checksum: "${expectedChecksum}"`)
    } else {
      throw new Error(
        `Unable to verify checksum for ${assetName}. Expected to find "${expectedChecksum}" in release notes.`
      )
    }
  }

  static create(octokit: Octokit): ReleasesService {
    return new ReleasesService(core, process, fs, octokit)
  }
}

function getRepo(app: AppInfo): ReposListReleasesParameters {
  return {owner: 'k14s', repo: app.name}
}

function getAssetName(platform: string, app: AppInfo): string {
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
