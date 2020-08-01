import { mock, MockProxy } from 'jest-mock-extended'
import { Installer, DownloadService, GitHubDownloadMeta } from '@jbrunton/gha-installer'
import { ActionsCore, ActionsToolCache, FileSystem } from '@jbrunton/gha-installer/lib/interfaces'
import { ReposListReleasesItem } from '@jbrunton/gha-installer/lib/octokit'
import { K14sReleasesService } from '../../src/k14s_releases_service'
import { TestOctokit, createTestOctokit } from '../fixtures/test_octokit'

const assetNames = {
  linux: "ytt-linux-amd64",
  win32: "ytt-windows-amd64.exe"
}
const downloadUrls = {
  linux: "https://example.com/k14s/ytt/releases/download/0.28.0/ytt-linux-amd64",
  win32: "https://example.com/k14s/ytt/releases/download/0.28.0/ytt-windows-amd64.exe"
}
const downloadPaths = {
  linux: "/downloads/ytt-linux-amd64",
  win32: "/downloads/ytt-windows-amd64.exe"
}
const binPaths = {
  linux: "/bin/ytt",
  win32: "/bin/ytt.exe"
}
const expectedContent = "foo bar baz"
const expectedChecksums = {
  linux: '"dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-linux-amd64"',
  win32: '"dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-windows-amd64.exe"'
}

describe('Installer', () => {
  let octokit: TestOctokit
  let core: MockProxy<ActionsCore>
  let cache: MockProxy<ActionsToolCache>
  let fs: MockProxy<FileSystem>

  beforeEach(() => {
    core = mock<ActionsCore>()
    cache = mock<ActionsToolCache>()
    fs = mock<FileSystem>()   
    octokit = createTestOctokit()
    octokit.stubListReleasesResponse({ owner: 'k14s', repo: 'ytt' }, [
      releaseJsonFor('ytt', '0.10.1'), // a more recent security patch
      releaseJsonFor('ytt', '0.28.0'), // the latest version by semver number
      releaseJsonFor('ytt', '0.27.0')
    ])
  })

  function stubCacheMiss(platform: 'linux' | 'win32') {
    const binName = platform == 'win32' ? 'ytt.exe' : 'ytt'
    // stub the download itself
    cache.downloadTool
      .calledWith(downloadUrls[platform])
      .mockReturnValue(Promise.resolve(downloadPaths[platform]))
    // stub caching the downloaded file
    cache.cacheFile
      .calledWith(downloadPaths[platform], binName, binName, "0.28.0")
      .mockReturnValue(Promise.resolve(binPaths[platform]))
  }

  function stubFile(path: string, content: string) {
    fs.readFileSync.calledWith(path).mockReturnValue(Buffer.from(content, "utf8"))
  }

  function releaseJsonFor(app: string, version: string): ReposListReleasesItem {
    return {
      tag_name: version,
      assets: [{
        browser_download_url: `https://example.com/k14s/${app}/releases/download/${version}/${app}-linux-amd64`,
        name: `${app}-linux-amd64`
      }, {
        browser_download_url: `https://example.com/k14s/${app}/releases/download/${version}/${app}-windows-amd64.exe`,
        name: `${app}-windows-amd64.exe`
      }],
      body: `* some cool new features\n${expectedChecksums.linux}\n${expectedChecksums.win32}`
    } as ReposListReleasesItem
  }

  function createInstaller(platform: "win32" | "linux"): Installer<GitHubDownloadMeta> {
    const env = { platform: platform }
    const releasesService = new K14sReleasesService(core, env, fs, octokit)
    const installer = new Installer(core, cache, fs, env, releasesService)
    return installer
  }

  test("it installs a new app on nix systems", async () => {
    const installer = createInstaller('linux')
    stubCacheMiss('linux')
    stubFile(downloadPaths.linux, expectedContent)

    await installer.installApp({ name: 'ytt', version: 'latest' })

    expect(core.info).toHaveBeenCalledWith("Downloading ytt 0.28.0 from https://example.com/k14s/ytt/releases/download/0.28.0/ytt-linux-amd64")
    expect(core.info).toHaveBeenCalledWith(`✅  Verified checksum: "dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-linux-amd64"`)
    expect(fs.chmodSync).toHaveBeenCalledWith(downloadPaths.linux, "755")
    expect(core.addPath).toHaveBeenCalledWith(binPaths.linux)
  })

  test('it installs a new app on windows', async () => {
    const installer = createInstaller('win32')
    stubCacheMiss('win32')
    stubFile(downloadPaths.win32, expectedContent)

    await installer.installApp({ name: 'ytt', version: '0.28.0' })

    expect(core.info).toHaveBeenCalledWith("Downloading ytt 0.28.0 from https://example.com/k14s/ytt/releases/download/0.28.0/ytt-windows-amd64.exe")
    expect(core.info).toHaveBeenCalledWith(`✅  Verified checksum: "dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-windows-amd64.exe"`)
    expect(fs.chmodSync).toHaveBeenCalledWith(downloadPaths.win32, "755")
    expect(core.addPath).toHaveBeenCalledWith(binPaths.win32)
  })

  test("it adds a cached app to the path on nix systems", async () => {
    const installer = createInstaller('linux')
    cache.find.calledWith("ytt", "0.28.0").mockReturnValue(binPaths.linux)

    await installer.installApp({ name: 'ytt', version: '0.28.0' })

    expect(core.info).toHaveBeenCalledWith("ytt 0.28.0 already in tool cache")
    expect(cache.downloadTool).not.toHaveBeenCalled()
    expect(core.addPath).toHaveBeenCalledWith(binPaths.linux)
  })

  test("it adds a cached app to the path on windows", async () => {
    const installer = createInstaller('win32')
    cache.find.calledWith("ytt.exe", "0.28.0").mockReturnValue(binPaths.win32)

    await installer.installApp({ name: 'ytt', version: 'latest' })

    expect(core.info).toHaveBeenCalledWith("ytt 0.28.0 already in tool cache")
    expect(cache.downloadTool).not.toHaveBeenCalled()
    expect(core.addPath).toHaveBeenCalledWith(binPaths.win32)
  })

  test('it verifies the checksums on nix systems', async () => {
    const installer = createInstaller('linux')
    stubCacheMiss('linux')
    stubFile(downloadPaths.linux, "unexpected content")

    const result = installer.installApp({ name: 'ytt', version: 'latest' })

    await expect(result).rejects.toThrowError('Unable to verify checksum for ytt-linux-amd64. Expected to find "70f71fa558520b944152eea2ec934c63374c630302a981eab010e0da97bc2f24  ./ytt-linux-amd64" in release notes.')
  })

  test('it verifies the checksums on windows', async () => {
    const installer = createInstaller('win32')
    stubCacheMiss('win32')
    stubFile(downloadPaths.win32, "unexpected content")

    const result = installer.installApp({ name: 'ytt', version: 'latest' })

    await expect(result).rejects.toThrowError('Unable to verify checksum for ytt-windows-amd64.exe. Expected to find "70f71fa558520b944152eea2ec934c63374c630302a981eab010e0da97bc2f24  ./ytt-windows-amd64.exe" in release notes.')
  })
})
