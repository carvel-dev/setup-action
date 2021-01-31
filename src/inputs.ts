import {ActionsCore, Environment} from '@jbrunton/gha-installer/lib/interfaces'
import {AppInfo} from '@jbrunton/gha-installer'

export const carvelApps = ['ytt', 'kbld', 'kapp', 'kwt', 'imgpkg', 'vendir']

export class Inputs {
  private _apps?: AppInfo[]
  private _core: ActionsCore
  private _env: Environment

  constructor(core: ActionsCore, env: Environment) {
    this._core = core
    this._env = env
  }

  public getAppsToDownload(): AppInfo[] {
    const apps = this.parseAppsList()

    if (apps.length == 0) {
      // if no options specified, download all
      apps.push(...this.getAllApps())
    }

    this._apps = apps.map((appName: string) => {
      if (!carvelApps.includes(appName)) {
        throw Error(`Unknown app: ${appName}`)
      }
      return {name: appName, version: this._core.getInput(appName)}
    })

    return this._apps
  }

  private getAllApps(): string[] {
    if (this._env.platform == 'win32') {
      // kwt isn't available for Windows
      return carvelApps.filter(app => app != 'kwt')
    }
    return carvelApps
  }

  private parseAppsList(): string[] {
    return this._core
      .getInput('only')
      .split(',')
      .map((appName: string) => appName.trim())
      .filter((appName: string) => appName != '')
  }
}
