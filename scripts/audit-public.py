"""Audit the Git publish candidates and the built static workbench with Git and ripgrep."""

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import json
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
SITE = "https://workbench.invalid"
OWNER_EMAIL = "youssefkharbout3@gmail.com"
REPO = "/youss8/youssef-operations-kit"

# Only print paths. A matching value may itself be a credential.
SECRET = "|".join([
    r"-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----",
    r"(?:AKIA|ASIA)[A-Z0-9]{16}",
    r"gh[pousr]_[A-Za-z0-9]{32,}|github_pat_[A-Za-z0-9_]{30,}",
    r"sk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}|AIza[0-9A-Za-z_-]{35}",
    r"xox[baprs]-[A-Za-z0-9-]{12,}",
    r"eyJ[A-Za-z0-9_-]{12,}\.eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}",
    r"(?i:(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis)://[^\s/:@]+:[^\s/@]+@)",
    r"^\s*APP_KEY=base64:[A-Za-z0-9/+]{40,}",
    r"(?i:(?:api[_-]?key|client[_-]?secret|private[_-]?token|access[_-]?token|password)"
    r"\s*[:=]\s*[\x22\x27][A-Za-z0-9+/_=-]{16,}[\x22\x27])",
])
PRIVATE_URL = (
    r"(?i)\b(?:https?|wss?)://(?:localhost|127(?:\.\d+){3}|10(?:\.\d+){3}|"
    r"192\.168(?:\.\d+){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d+){2}|"
    r"\[(?:::1|f[cd][a-f0-9:]+)\]|[a-z0-9.-]+\.(?:internal|corp|lan|local))"
    r"(?::\d+)?(?:[/\s\x22\x27]|$)"
)
STUB = r"(?i)\b(?:[T]ODO|[F]IXME)\b|\.\.\.\s*rest of (?:the )?code|throw new Error\([\x22\x27]not implemented|javascript:\s*void\(0\)"
EMAIL = re.compile(r"(?<![\w.%+-])[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
CSS_URL = re.compile(r"""url\(\s*["']?([^)"'\s]+)["']?\s*\)""")
JS_IMPORT = re.compile(r"""(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']((?:\./|\.\./|/_astro/)[^"'\s]+\.m?js(?:\?[^"'\s]*)?)["']""")


def git_files():
    candidates = subprocess.check_output(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"], cwd=ROOT
    ).decode("utf-8").split("\0")
    return [name for name in candidates if name and (ROOT / name).is_file()]


def matches(pattern, names):
    hits = []
    for offset in range(0, len(names), 32):
        result = subprocess.run(
            ["rg", "--hidden", "-a", "-l", "-e", pattern, "--", *names[offset:offset + 32]],
            cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace",
        )
        if result.returncode not in (0, 1):
            raise RuntimeError("ripgrep could not read its inputs")
        hits.extend(result.stdout.splitlines())
    return hits


def fixture_changes():
    handoff = (ROOT / "HANDOFF_MASTER_SPEC.md").read_text(encoding="utf-8")
    names = ["it-service-desk", "it-estate-ops", "hr-leave-desk", "hr-attendance", "pt-kpi-cockpit", "pt-funding-flow"]
    by_language = {
        "json": [ROOT / "src/data/demos" / (name + ".json") for name in names],
        "mermaid": [ROOT / "src/data/diagrams" / f"sys{i:02}.mmd" for i in range(1, 4)],
    }
    changed = []
    for language, paths in by_language.items():
        fence = "\x60" * 3
        blocks = re.findall(rf"^{fence}{language}\n(.*?)\n{fence}[ \t]*$", handoff, re.M | re.S)
        if len(blocks) != len(paths):
            changed.append("HANDOFF_MASTER_SPEC.md (" + language + " block count)")
            continue
        for path, block in zip(paths, blocks):
            if not path.is_file() or path.read_text(encoding="utf-8").splitlines() != block.splitlines():
                changed.append(path.relative_to(ROOT).as_posix())
    return changed


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        for attr in ("href", "src", "action", "poster", "component-url", "renderer-url", "before-hydration-url"):
            if values.get(attr):
                self.refs.append((tag, values[attr]))
        srcset = values.get("srcset", "")
        if srcset and not srcset.startswith("data:"):
            self.refs.extend((tag, item.strip().split()[0]) for item in srcset.split(",") if item.strip())

def approved_contact(url):
    if url.scheme == "mailto":
        return url.path == OWNER_EMAIL and not url.query
    if url.scheme != "https" or url.username or url.password or url.query:
        return False
    path = url.path.rstrip("/")
    if url.netloc in ("linkedin.com", "www.linkedin.com"):
        return path == "/in/youssef-kharbout"
    if url.netloc != "github.com":
        return False
    if path in ("/youss8", REPO, REPO + "/blob/main/LICENSE"):
        return True
    match = re.fullmatch(re.escape(REPO) + r"/blob/[^/]+/(src/content/(?:templates|ai-kit)/[\w.-]+\.md)", path)
    return bool(match and (ROOT / unquote(match[1])).is_file())


def audit_references(files, failures):
    pages = {}
    links = []
    # Each guide can link to the external sources named in its own catalogue record.
    declared_sources = {"claude-code-skills/index.html": {
        "https://code.claude.com/docs/en/skills", "https://developers.openai.com/codex/skills",
    }}
    profile_sources = ROOT / "src/lib/prompt-builder/profile-sources.json"
    declared_sources["ai-kit/prompt-builder/index.html"] = set(json.loads(profile_sources.read_text(encoding="utf-8")).values())
    delivery = json.loads((ROOT / "src/data/claude-skill-delivery.json").read_text(encoding="utf-8"))
    for category in (ROOT / "src/data/claude-skills").glob("*.json"):
        for guide in json.loads(category.read_text(encoding="utf-8")):
            origin = f"claude-code-skills/{guide['slug']}/index.html"
            package = delivery[guide["slug"]]
            export = DIST / "claude-code-skills/download" / guide["slug"] / "guide.json"
            record = json.loads(export.read_text(encoding="utf-8"))
            declared_sources[origin] = {guide["source"], guide.get("upstream"), package["url"], package.get("repositoryZip"),
                                     package.get("packageUrl"), guide.get("exampleRun", {}).get("source"),
                                     record.get("formatFile"), *(item["source"] for item in record["compatibility"])} - {None}
    for name in files:
        file = ROOT / name
        kind = file.suffix.lower()
        if kind == ".html":
            page = Page()
            page.feed(file.read_text(encoding="utf-8"))
            pages[file.resolve()] = page
            links.extend((file, tag, value) for tag, value in page.refs)
        elif kind in (".css", ".js", ".mjs"):
            text = file.read_text(encoding="utf-8")
            targets = CSS_URL.findall(text) if kind == ".css" else JS_IMPORT.findall(text)
            links.extend((file, kind, value) for value in targets if not value.startswith(("data:", "#")))

    # The command index contains live destinations generated from all content collections.
    index_file = DIST / "search-index.json"
    index = json.loads(index_file.read_text(encoding="utf-8"))
    links.extend((index_file, "a", item["href"]) for item in [*index["entries"], *index["intents"]] if item.get("href"))
    counts = Counter()
    for file, tag, value in links:
        counts[tag] += 1
        origin = file.relative_to(DIST).as_posix()
        route = "/" + origin.removesuffix("index.html")
        url = urlsplit(urljoin(SITE + route, value))
        if url.scheme == "data" and tag in ("img", "source", "link"):
            continue
        if url.netloc != "workbench.invalid" or url.scheme != "https":
            declared_source = (url.scheme == "https" and not url.username and not url.password
                               and value in declared_sources.get(origin, ()))
            if tag != "a" or not (approved_contact(url) or declared_source):
                failures.add(f"{origin} ({tag}: unapproved external destination)")
            continue
        target = (DIST / unquote(url.path).lstrip("/")).resolve()
        if not target.is_relative_to(DIST):
            failures.add(f"{origin} ({tag}: reference outside export)")
            continue
        if target.is_dir():
            target /= "index.html"
        if not target.is_file():
            failures.add(f"{origin} ({tag}: missing {target.relative_to(DIST).as_posix()})")
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            failures.add(f"{origin} ({tag}: missing fragment in {target.relative_to(DIST).as_posix()})")
    print(f"Checked {len(pages)} HTML documents, {len(links)} references and {counts['.css']} CSS asset references.")


def main():
    if not (DIST / "index.html").is_file() or not (DIST / "search-index.json").is_file():
        sys.exit("Build the static site with npm run build before running this audit.")
    candidates = git_files()
    built = [p.relative_to(ROOT).as_posix() for p in DIST.rglob("*") if p.is_file()]
    source = [name for name in candidates if name.startswith(("src/", "public/"))]
    failures = set()
    for field_name, pattern, files in [
        ("credential signature", SECRET, candidates + built),
        ("private URL", PRIVATE_URL, source),
        ("unfinished implementation marker", STUB, source),
    ]:
        failures.update(f"{name} ({field_name})" for name in matches(pattern, files))
    for name in source:
        try:
            text = (ROOT / name).read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if any(email != OWNER_EMAIL for email in EMAIL.findall(text)):
            failures.add(name + " (unapproved contact address)")
    for name in built:
        file = Path(name)
        private_file = file.suffix.lower() in (".key", ".pem", ".p12") or file.name == ".env" or file.name.startswith(".env.")
        internal_file = name in ("dist/index.php", "dist/.htaccess", "dist/debug.log", "dist/HANDOFF_MASTER_SPEC.md")
        if private_file or internal_file:
            failures.add(name + " (private or development file in static export)")
    failures.update(name + " (handoff mismatch)" for name in fixture_changes())
    audit_references(built, failures)
    print(f"Scanned {len(candidates)} publishable Git files, {len(built)} built files, six datasets and three diagrams.")
    if failures:
        for issue in sorted(failures):
            print(issue)
        return 1
    print("Passed credential signatures, public contacts, private URL and stub checks, fixture integrity, and local links.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
