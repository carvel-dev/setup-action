import { Inputs, carvelApps } from '../../src/inputs'
import { mock } from 'jest-mock-extended';
import { ActionsCore } from '@jbrunton/gha-installer/lib/interfaces';

describe('Inputs', () => {
  function createInputs(platform: string, inputs: {[key: string]: string} = {}): Inputs {
    const core = mock<ActionsCore>()
    core.getInput.calledWith('only').mockReturnValue(inputs.only || '')
    core.getInput.calledWith('exclude').mockReturnValue(inputs.exclude || '')
    for (let appName of carvelApps) {
      core.getInput.calledWith(appName).mockReturnValue(inputs[appName] || 'latest')
    }
    return new Inputs(core, { platform: platform })
  }

  describe('getAppsToDownload()', () => {
    test('defaults to all', () => {
      const inputs = createInputs("linux")
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "latest" },
        { name: "kbld", "version": "latest" },
        { name: "kapp", "version": "latest" },
        { name: "kwt", "version": "latest" },
        { name: "imgpkg", "version": "latest" },
        { name: "vendir", "version": "latest" },
        { name: "kctrl", "version": "latest" }
      ])
    })

    test('excludes kwt for windows', () => {
      const inputs = createInputs("win32")
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "latest" },
        { name: "kbld", "version": "latest" },
        { name: "kapp", "version": "latest" },
        { name: "imgpkg", "version": "latest" },
        { name: "vendir", "version": "latest" },
        { name: "kctrl", "version": "latest" },
      ])
    })

    test('allows version overrides', () => {
      const inputs = createInputs("linux", { ytt: "0.28.0" })
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "0.28.0" },
        { name: "kbld", "version": "latest" },
        { name: "kapp", "version": "latest" },
        { name: "kwt", "version": "latest" },
        { name: "imgpkg", "version": "latest" },
        { name: "vendir", "version": "latest" },
        { name: "kctrl", "version": "latest" }
      ])
    })

    test('limits apps to "only" list', () => {
      const inputs = createInputs("linux", { only: "ytt, kbld" })
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "latest" },
        { name: "kbld", "version": "latest" }
      ])
    })

    test('allows for app list override', () => {
      const inputs = createInputs("linux", { only: "ytt, kbld", ytt: "0.28.0" })
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "ytt", "version": "0.28.0" },
        { name: "kbld", "version": "latest" }
      ])
    })

    test('excludes apps from "exclude" list', () => {
      const inputs = createInputs("linux", { exclude: "ytt, kwt", kapp: "0.34.0" })
    
      const apps = inputs.getAppsToDownload()
    
      expect(apps).toEqual([
        { name: "kbld", "version": "latest" },
        { name: "kapp", "version": "0.34.0" },
        { name: "imgpkg", "version": "latest" },
        { name: "vendir", "version": "latest" },
        { name: "kctrl", "version": "latest" }
      ])
    })

    test('validates app names', () => {
      const inputs = createInputs("linux", { only: "ytt, kbl" })    
      expect(() => inputs.getAppsToDownload()).toThrowError("Unknown app: kbl")
    }) 
  })
})
