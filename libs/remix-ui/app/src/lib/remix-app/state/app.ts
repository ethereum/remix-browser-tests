import { desktopConnextionType, GitHubUser } from "@remix-api";
import { AppState } from "../interface";

export const appInitialState: AppState = {
  gitHubUser: {} as GitHubUser,
  currentBranch: null,
  needsGitInit: true,
  canUseGit: false,
  showPopupPanel: false,
  connectedToDesktop: desktopConnextionType.disabled
} 