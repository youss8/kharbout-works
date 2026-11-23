export type SearchGroup = "pages" | "assets";

export interface SearchEntry {
  group: SearchGroup;
  kind: string;
  title: string;
  summary: string;
  href: string;
  keywords: string[];
}

export interface SearchIntent {
  terms: string[];
  title: string;
  summary: string;
  href?: string;
  action?: "theme";
}

export interface CommandIndex {
  entries: SearchEntry[];
  intents: SearchIntent[];
}
