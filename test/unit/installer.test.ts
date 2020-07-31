import { mock, MockProxy } from 'jest-mock-extended'
import { Installer, GitHubDownloadInfo, DownloadService } from '@jbrunton/gha-installer'
import { ActionsCore, ActionsToolCache, FileSystem } from '@jbrunton/gha-installer/lib/interfaces'
import { ReposListReleasesItem } from '@jbrunton/gha-installer/lib/octokit'

describe('Installer', () => {
  const app = { name: "ytt", version: "0.28.0" }
  const assetNames = {
    linux: "ytt-linux-amd64",
    win32: "ytt-windows-amd64.exe"
  }
  const downloadUrls = {
    linux: "example.com/ytt/0.28.0/ytt-linux-amd64",
    win32: "example.com/ytt/0.28.0/ytt-windows-amd64.exe"
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

  let installer: Installer
  let core: MockProxy<ActionsCore>
  let cache: MockProxy<ActionsToolCache>
  let fs: MockProxy<FileSystem>

  beforeEach(() => {
    core = mock<ActionsCore>()
    cache = mock<ActionsToolCache>()
    fs = mock<FileSystem>()   
  })

  function createInstaller(platform: "win32" | "linux"): Installer {
    const env = { platform: platform }
    const releasesService = mock<DownloadService>()
    installer = new Installer(core, cache, fs, env, releasesService)

    const downloadInfo: GitHubDownloadInfo = {
      version: "0.28.0",
      url: downloadUrls[platform],
      release: {
        body: `* cool stuff\n${expectedChecksums[platform]}`
      } as ReposListReleasesItem
    }
    releasesService.getDownloadInfo
      .calledWith(app)
      .mockReturnValue(Promise.resolve(downloadInfo))
    
    return installer
  }

  test("it installs a new app on nix systems", async () => {
    const installer = createInstaller('linux')
    cache.downloadTool
      .calledWith(downloadUrls.linux)
      .mockReturnValue(Promise.resolve(downloadPaths.linux))
    cache.cacheFile
      .calledWith(downloadPaths.linux, "ytt", "ytt", "0.28.0")
      .mockReturnValue(Promise.resolve(binPaths.linux))
    fs.readFileSync
      .calledWith(downloadPaths.linux)
      .mockReturnValue(Buffer.from(expectedContent, "utf8"))

    await installer.installApp(app)

    expect(core.info).toHaveBeenCalledWith("Downloading ytt 0.28.0 from example.com/ytt/0.28.0/ytt-linux-amd64")
    expect(core.info).toHaveBeenCalledWith(`✅  Verified checksum: "dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-linux-amd64"`)
    expect(fs.chmodSync).toHaveBeenCalledWith(downloadPaths.linux, "755")
    expect(core.addPath).toHaveBeenCalledWith(binPaths.linux)
  })

  test('it installs a new app on windows', async () => {
    const installer = createInstaller('win32')
    cache.downloadTool
      .calledWith(downloadUrls.win32)
      .mockReturnValue(Promise.resolve(downloadPaths.win32))
    cache.cacheFile
      .calledWith(downloadPaths.win32, "ytt.exe", "ytt.exe", "0.28.0")
      .mockReturnValue(Promise.resolve(binPaths.win32))
    fs.readFileSync
      .calledWith(downloadPaths.win32)
      .mockReturnValue(Buffer.from(expectedContent, "utf8"))

    await installer.installApp(app)

    expect(core.info).toHaveBeenCalledWith("Downloading ytt 0.28.0 from example.com/ytt/0.28.0/ytt-windows-amd64.exe")
    expect(core.info).toHaveBeenCalledWith(`✅  Verified checksum: "dbd318c1c462aee872f41109a4dfd3048871a03dedd0fe0e757ced57dad6f2d7  ./ytt-windows-amd64.exe"`)
    expect(fs.chmodSync).toHaveBeenCalledWith(downloadPaths.win32, "755")
    expect(core.addPath).toHaveBeenCalledWith(binPaths.win32)
  })

  test("it adds a cached app to the path on nix systems", async () => {
    const installer = createInstaller('linux')
    cache.find.calledWith("ytt", "0.28.0").mockReturnValue(binPaths.linux)

    await installer.installApp(app)

    expect(core.info).toHaveBeenCalledWith("ytt 0.28.0 already in tool cache")
    expect(cache.downloadTool).not.toHaveBeenCalled()
    expect(core.addPath).toHaveBeenCalledWith(binPaths.linux)
  })

  test("it adds a cached app to the path on windows", async () => {
    const installer = createInstaller('win32')
    cache.find.calledWith("ytt.exe", "0.28.0").mockReturnValue(binPaths.win32)

    await installer.installApp(app)

    expect(core.info).toHaveBeenCalledWith("ytt 0.28.0 already in tool cache")
    expect(cache.downloadTool).not.toHaveBeenCalled()
    expect(core.addPath).toHaveBeenCalledWith(binPaths.win32)
  })

  test('it verifies the checksums on nix systems', async () => {
    const installer = createInstaller('linux')
    cache.downloadTool
      .calledWith(downloadUrls.linux)
      .mockReturnValue(Promise.resolve(downloadPaths.linux))
    cache.cacheFile
      .calledWith(downloadPaths.linux, "ytt", "ytt", "0.28.0")
      .mockReturnValue(Promise.resolve(binPaths.linux))
    fs.readFileSync
      .calledWith(downloadPaths.linux)
      .mockReturnValue(Buffer.from("unexpected content", "utf8"))

    const result = installer.installApp(app)

    await expect(result).rejects.toThrowError('Unable to verify checksum for ytt-linux-amd64. Expected to find "70f71fa558520b944152eea2ec934c63374c630302a981eab010e0da97bc2f24  ./ytt-linux-amd64" in release notes.')
  })

  test('it verifies the checksums on windows', async () => {
    const installer = createInstaller('win32')
    cache.downloadTool
      .calledWith(downloadUrls.win32)
      .mockReturnValue(Promise.resolve(downloadPaths.win32))
    cache.cacheFile
      .calledWith(downloadPaths.win32, "ytt.exe", "ytt.exe", "0.28.0")
      .mockReturnValue(Promise.resolve(binPaths.win32))
    fs.readFileSync
      .calledWith(downloadPaths.win32)
      .mockReturnValue(Buffer.from("unexpected content", "utf8"))

    const result = installer.installApp(app)

    await expect(result).rejects.toThrowError('Unable to verify checksum for ytt-windows-amd64.exe. Expected to find "70f71fa558520b944152eea2ec934c63374c630302a981eab010e0da97bc2f24  ./ytt-windows-amd64.exe" in release notes.')
  })
})
