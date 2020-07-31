import { K14sReleasesService, getAssetName } from '../../src/k14s_releases_service'
import { mock } from 'jest-mock-extended';
import { TestOctokit, createTestOctokit } from '../fixtures/test_octokit'
import { ActionsCore, FileSystem } from '@jbrunton/gha-installer/lib/interfaces';
import { ReposListReleasesItem } from '@jbrunton/gha-installer/lib/octokit';

describe('ReleasesService', () => {

  function createService(platform: string, octokit: TestOctokit = createTestOctokit()) {
    const env = { platform: platform }
    const core = mock<ActionsCore>()
    const fs = mock<FileSystem>()
    return new K14sReleasesService(core, env, fs, octokit)
  }

  test('getAssetName()', () => {
    {
      const assetName = getAssetName('linux', { name: 'ytt', version: '0.28.0' })
      expect(assetName).toEqual("ytt-linux-amd64")
    }
    {
      const assetName = getAssetName('win32', { name: 'ytt', version: '0.28.0' })
      expect(assetName).toEqual("ytt-windows-amd64.exe")
    }
    {
      const assetName = getAssetName('darwin', { name: 'kbld', version: '0.10.0' })
      expect(assetName).toEqual("kbld-darwin-amd64")
    }
  })

  function releaseJsonFor(app: string, version: string): ReposListReleasesItem {
    return {
      tag_name: version,
      assets: [{
        browser_download_url: `https://example.com/k14s/ytt/releases/download/${version}/ytt-linux-amd64`,
        name: `${app}-linux-amd64`
      }]
    } as ReposListReleasesItem
  }

  describe('getDownloadInfoForAsset()', () => {
    let service: K14sReleasesService
    let octokit: TestOctokit

    function stubListReleasesResponse(releases: Array<ReposListReleasesItem>) {
      const params = { owner: "k14s", repo: "ytt" }
      octokit.stubListReleasesResponse(params, releases)
    }

    beforeEach(() => {
      octokit = createTestOctokit()      
      service = createService("linux", octokit)
    })

    test('it returns the asset for the specific version, if given', async () => {
      stubListReleasesResponse([
        releaseJsonFor("ytt", "0.28.0"),
        releaseJsonFor("ytt", "0.27.0")
      ])
      const downloadInfo = await service.getDownloadInfo({ name: "ytt", version: "0.27.0" })
      expect(downloadInfo).toEqual({
        version: "0.27.0",
        url: "https://example.com/k14s/ytt/releases/download/0.27.0/ytt-linux-amd64",
        release: releaseJsonFor("ytt", "0.27.0")
      })
    })

    test('it returns the latest version', async () => {
      stubListReleasesResponse([
        releaseJsonFor("ytt", "0.1.2"), // check we ignore patches for older versions
        releaseJsonFor("ytt", "0.28.0"),
        releaseJsonFor("ytt", "0.27.0")
      ])
      const downloadInfo = await service.getDownloadInfo({ name: "ytt", version: "latest" })
      expect(downloadInfo).toEqual({
        version: "0.28.0",
        url: "https://example.com/k14s/ytt/releases/download/0.28.0/ytt-linux-amd64",
        release: releaseJsonFor("ytt", "0.28.0")
      })
    })

    test('errors if it cannot find the version', async () => {
      stubListReleasesResponse([
        releaseJsonFor("ytt", "0.28.0"),
        releaseJsonFor("ytt", "0.27.0")
      ])
      const result = service.getDownloadInfo({ name: "ytt", version: "not-a-version" })
      await expect(result).rejects.toThrowError('Could not find version "not-a-version" for ytt')
    })
  })
})
