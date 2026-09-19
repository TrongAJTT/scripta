import { CLOUD_STORAGE } from "../../../core/constants/app";

/**
 * API Endpoints, URL generators, and Quick Reference Documentation Links for Cloud Providers.
 */

// Last modified: 2026-09-19
export const GITHUB_ENDPOINTS = {
  API_BASE: "https://api.github.com",
  USER: "https://api.github.com/user",
  REPO: (owner: string, repo: string) =>
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
  CONTENTS: (owner: string, repo: string, path: string) =>
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`,
  // Quick links for PAT creation and documentation
  CREATE_PAT_CLASSIC:
    "https://github.com/settings/tokens/new?scopes=repo&description=Scripta%20Cloud%20Sync",
  CREATE_PAT_FINE_GRAINED:
    "https://github.com/settings/personal-access-tokens/new",
  DOCS_PAT:
    "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
} as const;

// Last modified: 2026-09-19
export const DROPBOX_ENDPOINTS = {
  OAUTH_AUTHORIZE: "https://www.dropbox.com/oauth2/authorize",
  OAUTH_TOKEN: "https://api.dropboxapi.com/oauth2/token",
  FILES_DOWNLOAD: "https://content.dropboxapi.com/2/files/download",
  FILES_UPLOAD: "https://content.dropboxapi.com/2/files/upload",
  FILES_DELETE: "https://api.dropboxapi.com/2/files/delete_v2",
  FILES_LIST_FOLDER: "https://api.dropboxapi.com/2/files/list_folder",
  // Quick links for Dropbox App Console & Permissions
  APP_CONSOLE: "https://www.dropbox.com/developers/apps",
  DOCS_SCOPES:
    "https://developers.dropbox.com/oauth-guide#permissions-and-scopes",
  DROPBOX_REDIRECT_URI: CLOUD_STORAGE.DROPBOX_REDIRECT_URI,
  DROPBOX_APP_KEY: CLOUD_STORAGE.DROPBOX_APP_KEY,
} as const;
