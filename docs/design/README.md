# Catalogue design

**Question for design review:** Can a visitor tell what they can take, whether it fits their stack and where to start adapting it?

## Two layouts

**Browse.** Make the catalogue the front door. Lead with the kit's name and a one-line description. Group entries by the thing a visitor wants to take away. A result shows its name, a concrete use and its dependencies. Give each published entry a stable link so people can share it directly.

**Entry.** Show the outcome first, then a preview or worked example. Put the minimum requirements beside it. Follow with setup or usage, the parts someone is likely to change, and a quick way to verify the result. Link directly to the relevant source files when a real entry ships.

| Category | What a visitor takes away | What serves as its preview |
| --- | --- | --- |
| Components | An interface element | Rendered states and keyboard behaviour |
| Pages | A complete screen layout | Desktop and mobile examples |
| Utilities | A focused JavaScript or TypeScript function | A concrete input and its output |
| Modules | A workflow with connected parts | A short scenario and a link to its implementation |
| AI tools | A Claude skill, Gemini Gem guide or project instructions | A sample task, required tools and expected result |

## Rules for the first build

- Start with one browse layout and one entry layout. Open only categories with published entries in the live catalogue. The design mockup can show illustrative content.
- Use technology names as metadata. A TypeScript utility should be discoverable even if the visitor has never used Laravel. A Gemini guide needs to identify its target tool just as clearly as a component identifies its framework.
- Keep explanatory text next to the element it describes. On a phone the preview, requirements and instructions should read in that order. Allow labels to wrap. Use logical spacing and alignment so the layout can support Arabic.
- Source belongs with the entry that uses it. When the first feature arrives, add the files, a working example and its verification steps together. Introduce a shared abstraction when a second entry demonstrates what the two actually share.

The [static concept](catalogue.html) is the review artifact. The first feature and its implementation will be selected after the base design is agreed.
