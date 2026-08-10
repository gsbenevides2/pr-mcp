import { GitCloudAdapter } from "./Common";
import {Octokit} from "octokit"

export class GithubAdapter implements GitCloudAdapter {
    client = new Octokit({auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!})
    protected getOwnerAndNameOfRepository(repository:string){
        const [owner,name] = repository.split("/")
        return {owner, name}

    }
    public async getPrPatch(number: number, repository: string): Promise<string> {
        const {owner, name} = this.getOwnerAndNameOfRepository(repository)
        const prResponse = await this.client.rest.pulls.get({
            owner: owner,
            repo: name,
            pull_number: number,
            mediaType: {
                format: "patch"
            }
        })
        return prResponse.data as unknown as string
    }

    public async getPRFile(number: number, repository: string, path: string): Promise<string> {
        const {owner, name} = this.getOwnerAndNameOfRepository(repository)
        const prResponse = await this.client.rest.pulls.get({
            owner: owner,
            repo: name,
            pull_number: number,
        })
        const fileResponse = await this.client.rest.repos.getContent({
            owner: owner,
            repo: name,
            path: path,
            ref: prResponse.data.head.sha,
            mediaType: {
                format: "raw"
            }
        })
        return fileResponse.data as unknown as string
    }

}