import packageJson from "../../../package.json";

export const APP_NAME = "Scripta Dev";
export const APP_VERSION = packageJson.version;
export const APP_TITLE = `${APP_NAME} v${APP_VERSION}`;
export const APP_REPOSITORY = "https://github.com/TrongAJTT/scripta";
export const APP_HOMEPAGE = "https://scripta.trongajtt.com";

export const LEGAL_LINKS = {
  TERMS: "https://www.trongajtt.com/apps/scripta/terms",
  PRIVACY: "https://www.trongajtt.com/apps/scripta/policy",
} as const;

export const DONATE_LINKS = {
  BUY_ME_A_COFFEE: "https://buymeacoffee.com/trongajtt",
  GITHUB_SPONSOR: "https://github.com/sponsors/TrongAJTT",
  AUTHOR_DONATE: "https://www.trongajtt.com/donate",
} as const;

export const CLOUD_STORAGE = {
  // Public Client ID (App key) for Dropbox OAuth 2.0 PKCE
  DROPBOX_APP_KEY: "k2vouwk391dsfug",
  DROPBOX_REDIRECT_URI:
    typeof window !== "undefined"
      ? `${window.location.origin}/`
      : "http://localhost:5173/",
} as const;
