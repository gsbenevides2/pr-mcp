import { GitCloudAdapter } from "./Common"
import { GithubAdapter } from "./Github"
import { GitlabAdapter } from "./Gitlab"

export const GitCloudTypes = ["github", "gitlab"] as const
type GitCloudTypes =  typeof GitCloudTypes[number]

export class GitCloudAdapterFactory {
  static create(type: GitCloudTypes): GitCloudAdapter {
    switch (type) {
      case "github":
        return new GithubAdapter()
      case "gitlab":
        return new GitlabAdapter()

      default:
        throw new Error(`Unsupported ecommerce: ${type}`)
    }
  }
}