export const NOVELS_SEARCH = "novels-search";
export const NOVELS_CHAPTERS = "novels-chapters";
export const NOVELS_CHAPTER = "novels-chapter";
export const FAVORITES = "favorites";
export const FAVORITES_IS_FAVORITE = "favorites-is-favorite";
export const FAVORITES_NOVEL_CHAPTER = "favorites-novel-chapter";
export const HISTORY_NOVELS = "history-novels";
export const HISTORY_NOVEL = "history-novel";
export const HISTORY_READ = "history-read";
export const SETTINGS = "settings";
export const SETTINGS_REPLACEMENT_RULES = "settings-replacement-rules";
export const AUTH_IS_AUTHENTICATED = "auth-is-authenticated";

export type SlugServerInput = {
  slug: string;
  server: string;
};

export type ReplacementRulesInput = {
  replacementRules: { from: string; to: string }[];
};
