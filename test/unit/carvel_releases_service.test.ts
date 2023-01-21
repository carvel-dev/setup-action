import { AppInfo } from "@jbrunton/gha-installer";
import { getAssetName, getRepo } from "../../src/carvel_releases_service";

describe('CarvelReleasesService', () => {
  const kbldInfo: AppInfo = {
    name: "kbld",
    version: "latest"
  };

  const kctrlInfo: AppInfo = {
    name: "kctrl",
    version: "latest"
  };

  describe('getRepo', () => {
    it("returns the name of the repo for the app", () => {
      expect(getRepo(kbldInfo)).toEqual({
        owner: "carvel-dev",
        repo:  "kbld"
      })
      // kctrl is a special case
      expect(getRepo(kctrlInfo)).toEqual({
        owner: "carvel-dev",
        repo:  "kapp-controller"
      })
    })
  })

  describe('getAssetName', () => {
    it("returns the asset name for the given platform", () => {
      expect(getAssetName("darwin", kbldInfo)).toEqual("kbld-darwin-amd64")
      expect(getAssetName("win32", kbldInfo)).toEqual("kbld-windows-amd64.exe")
      expect(getAssetName("linux", kbldInfo)).toEqual("kbld-linux-amd64")
    })
  })
});
