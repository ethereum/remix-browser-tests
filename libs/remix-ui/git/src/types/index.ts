import { Endpoints } from "@octokit/types"
import { branch, branchDifference, commitChange, pagedCommits, remote, remoteBranch, repository, syncStatus } from "@remix-api"
import { ReadCommitResult } from "isomorphic-git"
export type GitHubUser = Partial<Endpoints["GET /user"]["response"]['data']>
export type userEmails = Endpoints["GET /user/emails"]["response"]["data"]

export type gitState = {
    currentBranch: branch
    currentHead: string
    commits: ReadCommitResult[]
    branch: string
    canCommit: boolean
    branches: branch[]
    remotes: remote[]
    defaultRemote: remote
    fileStatusResult: fileStatusResult[]
    canUseApp: boolean
    loading: boolean
    storageUsed: any
    reponame: string
    staged: fileStatusResult[]
    untracked: fileStatusResult[]
    deleted: fileStatusResult[]
    modified: fileStatusResult[]
    allchangesnotstaged: fileStatusResult[],
    repositories: repository[]
    remoteBranches: remoteBranch[]
    commitChanges: commitChange[]
    remoteBranchCommits: Record<string, pagedCommits[]>
    localBranchCommits: Record<string, ReadCommitResult[]>
    branchDifferences: Record<remoteBranchIdentifier, branchDifference>
    syncStatus: syncStatus,
    localCommitCount: number
    remoteCommitCount: number
    upstream: remote
    gitHubUser: GitHubUser
    userEmails: userEmails
    gitHubScopes: string[]
    gitHubAccessToken: string
    log: gitLog[]
}
export type gitLog = {
    type: 'error' | 'warning' | 'info' | 'success',
    message: string
}

export type remoteBranchIdentifier = `${string}/${string}`

export type loaderState = {
    branches: boolean
    remotes: boolean
    commits: boolean
    sourcecontrol: boolean
    plugin: boolean
}

export const defaultGitState: gitState = {
  currentBranch: { name: "", remote: { name: "", url: "" } },
  currentHead: "",
  commits: [],
  branch: "",
  canCommit: true,
  branches: [],
  remotes: [],
  defaultRemote: null,
  fileStatusResult: [],
  staged: [],
  untracked: [],
  deleted: [],
  modified: [],
  allchangesnotstaged: [],
  canUseApp: true,
  loading: false,
  storageUsed: {},
  reponame: "",
  repositories: [],
  remoteBranches: [],
  commitChanges: [],
  remoteBranchCommits: {},
  localBranchCommits: {},
  branchDifferences: {},
  syncStatus: syncStatus.none,
  localCommitCount: 0,
  remoteCommitCount: 0,
  upstream: null,
  gitHubUser: {} as GitHubUser,
  userEmails: [] as userEmails,
  gitHubScopes: [],
  gitHubAccessToken: "",
  log: []
}

export const defaultLoaderState: loaderState = {
  branches: false,
  commits: false,
  sourcecontrol: false,
  remotes: false,
  plugin: false
}

export type fileStatusResult = {
    filename: string,
    status?: fileStatus
    statusNames?: string[]
}

export type fileStatus = [string, 0 | 1, 0 | 1 | 2, 0 | 1 | 2 | 3]

export type statusMatrixType = { matrix: string[] | undefined; status: string[] }

export type sourceControlGroup = {
    group: fileStatusResult[],
    name: string
}

export interface fileStatusAction {
    type: string,
    payload: fileStatusResult[]
}

export interface setCommitsAction {
    type: string,
    payload: ReadCommitResult[]
}

export interface setBranchesAction {
    type: string,
    payload: any[]
}

export interface setReposAction {
    type: string,
    payload: any[]
}

export interface setRemoteBranchesAction {
    type: string,
    payload: any[]
}

export interface setGitHubUserAction {
    type: string,
    payload: any
}

export interface setLoadingAction {
    type: string,
    payload: boolean
}

export interface setCanUseAppAction {
    type: string,
    payload: boolean
}

export interface setRepoNameAction {
    type: string,
    payload: string
}

export interface setCurrentBranchAction {
    type: string,
    payload: branch
}

export interface setCurrentHeadAction {
    type: string,
    payload: string
}

export interface setRemotesAction {
    type: string,
    payload: remote[]
}

export interface setUpstreamAction {
    type: string,
    payload: remote
}

export interface setRemoteBranchCommitsAction {
    type: string,
    payload: {
        branch: branch,
        commits: pagedCommits[]
    }
}

export interface setLocalBranchCommitsAction {
    type: string,
    payload: {
        branch: branch,
        commits: ReadCommitResult[]
    }
}

export interface setBranchDifferencesAction {
    type: string,
    payload: {
        branch: branch,
        remote: remote,
        branchDifference: branchDifference
    }
}

export interface setTokenAction {
    type: string,
    payload: string
}

export interface setDefaultRemoteAction {
    type: string,
    payload: remote
}

export interface setLogAction {
    type: string,
    payload: gitLog
}

export interface clearLogAction {
    type: string
}

export type gitActionDispatch = setCurrentHeadAction | clearLogAction | setLogAction | setDefaultRemoteAction | setTokenAction | setUpstreamAction | setRemoteBranchCommitsAction | setLocalBranchCommitsAction | setBranchDifferencesAction | setRemotesAction | setCurrentBranchAction | fileStatusAction | setLoadingAction | setCanUseAppAction | setRepoNameAction | setCommitsAction | setBranchesAction | setReposAction | setRemoteBranchesAction