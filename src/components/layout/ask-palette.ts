import type Alpine from "alpinejs";
import type Fuse from "fuse.js";
import type { CommandIndex, SearchEntry, SearchIntent } from "../../data/command-index";

interface Option {
  title: string; summary: string; kind: string;
  href?: string; action?: "theme";
}
interface Result extends Option { index: number }
interface ResultGroup { title: string; items: Result[] }

const termsFor = (query: string) => query.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? [];
const dialogElement = () => document.getElementById("ask-workbench") as HTMLDialogElement;
const searchElement = () => document.getElementById("ask-query") as HTMLInputElement;

function directAnswers(intents: SearchIntent[], query: string, dark: boolean): Option[] {
  const words = new Set(termsFor(query));
  const matches = words.size
    ? intents.map(intent => ({ intent, score: intent.terms.filter(term => words.has(term)).length }))
      .filter(result => result.score > 0).sort((a, b) => b.score - a.score).map(result => result.intent)
    : intents.filter(intent => intent.terms.includes("cv") || intent.action === "theme");
  return matches.map(intent => ({
    title: intent.action === "theme" ? (dark ? "Switch to light mode" : "Switch to dark mode") : intent.title,
    summary: intent.summary, kind: "Quick action", action: intent.action, href: intent.href,
  }));
}

export default function registerAsk(AlpineClient: typeof Alpine) {
  AlpineClient.data("commandPalette", () => {
    let index: CommandIndex | undefined;
    let matcher: Fuse<SearchEntry> | undefined;
    let pending: Promise<void> | undefined;
    let returnFocus: HTMLElement | null = null;

    return {
      query: "", opened: false, selected: 0, groups: [] as ResultGroup[],
      state: "idle" as "idle" | "loading" | "ready" | "error", dark: false,
      get choices(): Result[] { return this.groups.flatMap(group => group.items); },
      get activeId(): string | null { return this.choices.length ? "ask-option-" + this.selected : null; },
      syncTheme() {
        this.dark = document.documentElement.dataset.theme === "dark";
        if (this.opened) this.filter(this.query);
      },
      async load() {
        if (index) { this.state = "ready"; this.filter(this.query); return; }
        this.state = "loading";
        try {
          pending ??= (async () => {
            const [response, { default: Search }] = await Promise.all([fetch("/search-index.json"), import("fuse.js")]);
            if (!response.ok) throw new Error("Search index unavailable");
            const payload: CommandIndex = await response.json();
            matcher = new Search(payload.entries, {
              keys: [{ name: "title", weight: .58 }, { name: "keywords", weight: .30 }, { name: "summary", weight: .12 }],
              threshold: .35, ignoreLocation: true, minMatchCharLength: 2,
            });
            index = payload;
          })();
          await pending;
          this.state = "ready";
          this.filter(this.query);
        } catch {
          this.state = "error";
          this.groups = [];
        } finally { pending = undefined; }
      },
      filter(query: string) {
        this.query = query;
        this.selected = 0;
        if (!index || !matcher) return;
        const term = query.trim();
        const results = term ? matcher.search(term).map(hit => hit.item) : index.entries;
        const limit = term ? 10 : 4;
        const sections: [string, Option[]][] = [
          ["Direct answers & quick actions", directAnswers(index.intents, term, this.dark)],
          ["Systems, sandboxes & pages", results.filter(item => item.group === "pages").slice(0, limit)],
          ["Vault, AI toolkit & templates", results.filter(item => item.group === "assets").slice(0, limit)],
        ];
        let indexInList = 0;
        this.groups = sections.filter(([, items]) => items.length).map(([title, items]) => ({
          title, items: items.map(item => ({ ...item, index: indexInList++ })),
        }));
      },
      open() {
        if (this.opened) { searchElement().focus(); return; }
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.query = "";
        this.opened = true;
        this.syncTheme();
        dialogElement().showModal();
        searchElement().focus();
        void this.load();
      },
      close() {
        if (dialogElement().open) dialogElement().close();
        this.opened = false;
        if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
        returnFocus = null;
      },
      shortcut(event: KeyboardEvent) {
        if (!event.isComposing && !event.altKey && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          this.open();
        }
      },
      navigate(event: KeyboardEvent) {
        if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          this.move(event.key === "ArrowDown" ? 1 : -1);
        } else if (event.key === "Enter" && this.choices.length) {
          event.preventDefault();
          this.choose(this.choices[this.selected]);
        }
      },
      move(step: number) {
        const count = this.choices.length;
        if (!count) return;
        this.selected = (this.selected + step + count) % count;
        document.getElementById("ask-option-" + this.selected)?.scrollIntoView({ block: "nearest" });
      },
      choose(option?: Result) {
        if (!option) return;
        this.close();
        if (option.action === "theme") {
          document.querySelector<HTMLButtonElement>("[data-theme-toggle]")?.click();
          return;
        }
        if (!option.href) return;
        const url = new URL(option.href, window.location.href);
        // A fresh same-page asset view clears any filters which could conceal the target.
        const sameDocument = url.origin === location.origin && url.pathname === location.pathname && url.search === location.search;
        window.location.assign(url.href);
        if (sameDocument && url.hash) location.reload();
      },
    };
  });
}
