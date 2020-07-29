export * as cache from '@actions/tool-cache'

export interface ActionsToolCache {
  find(toolName: string, versionSpec: string, arch?: string): string;
  downloadTool(url: string, dest?: string, auth?: string): Promise<string>;
  cacheFile(sourceFile: string, targetFile: string, tool: string, version: string, arch?: string): Promise<string>;
}
