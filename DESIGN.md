---
version: alpha
name: "Youssef’s Operations Kit"
description: "An illustrated parts catalogue for developers choosing an entry to reuse."
colors:
  paper: "#FAF8F3"
  index: "#EEECE6"
  ink: "#171A22"
  muted: "#535760"
  primary: "#173FB4"
  cobalt-hover: "#17399E"
  cobalt-pressed: "#102B78"
  on-cobalt: "#FFFFFF"
  rule: "#D4D2CB"
  control-border: "#747872"
  focus: "#1649CB"
typography:
  feature-title: { fontFamily: Inter, fontSize: 56px, fontWeight: 700, lineHeight: 1.14, letterSpacing: -2px }
  feature-title-compact: { fontFamily: Inter, fontSize: 40px, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5px }
  index-title: { fontFamily: Inter, fontSize: 40px, fontWeight: 700, lineHeight: 1.2, letterSpacing: -1.2px }
  index-title-compact: { fontFamily: Inter, fontSize: 28px, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.8px }
  masthead: { fontFamily: Inter, fontSize: 28px, fontWeight: 700, lineHeight: 1.14, letterSpacing: -0.9px }
  masthead-compact: { fontFamily: Inter, fontSize: 20px, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.65px }
  entry-title: { fontFamily: Inter, fontSize: 20px, fontWeight: 600, lineHeight: 1.2 }
  lead: { fontFamily: Inter, fontSize: 20px, fontWeight: 400, lineHeight: 1.4 }
  body: { fontFamily: Inter, fontSize: 16px, fontWeight: 400, lineHeight: 1.5 }
  action: { fontFamily: Inter, fontSize: 16px, fontWeight: 600, lineHeight: 1.5 }
  control: { fontFamily: Inter, fontSize: 16px, fontWeight: 500, lineHeight: 1.5 }
  small: { fontFamily: Inter, fontSize: 14px, fontWeight: 400, lineHeight: 1.43 }
  technical: { fontFamily: "IBM Plex Mono", fontSize: 14px, fontWeight: 400, lineHeight: 1.43 }
spacing:
  unit: 8px
  control-inset: 16px
  gutter: 24px
  entrance-visible-ratio: 0.2
  group-gap: 32px
  target: 48px
  section-compact: 56px
  masthead: 64px
  row: 80px
  section-wide: 96px
  cta-width: 200px
  shell-max: 1440px
  hairline: 1px
  ring-width: 3px
  ring-offset: 3px
rounded:
  flat: 0px
  control: 4px
motion:
  fast: { duration: 150ms }
  base: { duration: 250ms }
  slow: { duration: 400ms }
  child-stagger: { delay: 60ms }
  headline-limit: { duration: 800ms }
  scroll-scrub: { timingFunction: linear }
  enter: { timingFunction: "cubic-bezier(0.2, 0, 0, 1)" }
  exit: { timingFunction: "cubic-bezier(0.4, 0, 1, 1)" }
  emphasized: { timingFunction: "cubic-bezier(0.65, 0, 0.35, 1)" }
components:
  primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-cobalt}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    height: "{spacing.target}"
    width: "{spacing.cta-width}"
  primary-action-hover: { backgroundColor: "{colors.cobalt-hover}", textColor: "{colors.on-cobalt}" }
  primary-action-active: { backgroundColor: "{colors.cobalt-pressed}", textColor: "{colors.on-cobalt}" }
  primary-action-focus: { backgroundColor: "{colors.primary}", textColor: "{colors.on-cobalt}" }
  primary-action-disabled: { backgroundColor: "{colors.rule}", textColor: "{colors.muted}" }

  masthead-action:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    height: "{spacing.target}"
    rounded: "{rounded.flat}"
  masthead-action-hover: { backgroundColor: "{colors.paper}", textColor: "{colors.primary}" }
  masthead-action-active: { backgroundColor: "{colors.paper}", textColor: "{colors.cobalt-pressed}" }
  masthead-action-focus: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}" }
  masthead-action-disabled: { backgroundColor: "{colors.paper}", textColor: "{colors.muted}" }

  search-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "{spacing.target}"
  search-field-hover: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}" }
  search-field-active: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}" }
  search-field-focus: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}" }
  search-field-disabled: { backgroundColor: "{colors.rule}", textColor: "{colors.muted}" }

  category-select:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    height: "{spacing.target}"
  category-select-hover: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}" }
  category-select-active: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}" }
  category-select-focus: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}" }
  category-select-disabled: { backgroundColor: "{colors.rule}", textColor: "{colors.muted}" }

  compact-category:
    backgroundColor: "{colors.index}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    height: "{spacing.target}"
    rounded: "{rounded.flat}"
  compact-category-hover: { backgroundColor: "{colors.index}", textColor: "{colors.primary}" }
  compact-category-active: { backgroundColor: "{colors.index}", textColor: "{colors.cobalt-pressed}" }
  compact-category-focus: { backgroundColor: "{colors.index}", textColor: "{colors.ink}" }
  compact-category-disabled: { backgroundColor: "{colors.index}", textColor: "{colors.muted}" }

  entry-row:
    backgroundColor: "{colors.index}"
    textColor: "{colors.ink}"
    typography: "{typography.entry-title}"
    rounded: "{rounded.flat}"
    height: "{spacing.row}"
  entry-row-hover: { backgroundColor: "{colors.index}", textColor: "{colors.primary}" }
  entry-row-active: { backgroundColor: "{colors.index}", textColor: "{colors.cobalt-pressed}" }
  entry-row-focus: { backgroundColor: "{colors.index}", textColor: "{colors.ink}" }
  entry-row-disabled: { backgroundColor: "{colors.index}", textColor: "{colors.muted}" }
---

# Youssef’s Operations Kit

## Overview

A developer opening the catalogue should see something they can take into a project. The featured **Copy code** entry puts its purpose, requirements and **Open component** action together. The cobalt engraving of a tool case gives the kit its identity. On the phone it sits beside the title, leaving room for the first index result in the same viewport. [Approved desktop mockup](docs/design/illustrated-catalogue-desktop-1440x900.png) · [Approved iOS mockup](docs/design/illustrated-catalogue-ios-393x852.png)

This guide covers the illustrated catalogue’s light appearance. The PNGs establish its resting state. The prototype demonstrates keyboard focus, the accessible field border and the scroll choreography. Its two-column field guide becomes a compact pinned visual on tall phones. The front matter follows the Google Labs alpha format. [Working HTML prototype](docs/design/illustrated-catalogue.html) · [DESIGN.md specification](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)

## Colors

Use `paper` for the masthead, feature spread and input surfaces. The warmer gray `index` runs edge to edge beneath the catalogue, so a reader can find the list before reading its heading. Use `ink` for decisions such as entry names and control values. Use `muted` for supporting text such as requirements, descriptions, counts and search hints.

Reserve the solid cobalt `primary` fill for the single primary action. The same ink can outline the illustration, mark the current page and point to an entry without creating another filled button. White lettering stays legible as the button darkens through hover and press. Use `rule` for decorative separators and the disabled fill. Use the stronger `{colors.control-border}` where the edge helps identify an editable field.

### WCAG AA contrast audit

The table covers every permitted text/background combination in the approved views and the specified states. Ratios use opaque sRGB relative luminance, with pass/fail evaluated before rounding. All text is checked at **4.5:1**, including large headings and disabled labels. WCAG exempts inactive controls from its text requirement. The checks here keep their labels readable as well. [WCAG 2.2 text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

| Foreground | Background | Text use | Ratio | AA |
| --- | --- | --- | ---: | --- |
| `ink` | `paper` | Feature, masthead, entered query, desktop selector | 16.39:1 | Pass |
| `ink` | `index` | List heading, entry titles, compact selector | 14.72:1 | Pass |
| `muted` | `paper` | Breadcrumb, feature requirements, search hint, disabled navigation | 6.82:1 | Pass |
| `muted` | `index` | Entry metadata, summaries, count, disabled row or compact selector | 6.13:1 | Pass |
| `primary` | `paper` | Masthead hover | 8.22:1 | Pass |
| `primary` | `index` | Row title and compact selector on hover | 7.39:1 | Pass |
| `cobalt-pressed` | `paper` | Pressed masthead action | 12.07:1 | Pass |
| `cobalt-pressed` | `index` | Pressed row title or compact selector | 10.85:1 | Pass |
| `on-cobalt` | `primary` | Primary action at rest and on keyboard focus | 8.73:1 | Pass |
| `on-cobalt` | `cobalt-hover` | Primary action on hover | 9.93:1 | Pass |
| `on-cobalt` | `cobalt-pressed` | Primary action during press | 12.81:1 | Pass |
| `muted` | `rule` | Disabled primary action, input and desktop selector | 4.79:1 | Pass |

**Flagged non-text pair.** The mockup’s original field outline (`#B7B7AD`) measures **1.90:1** against the paper field and **1.71:1** against the index. It falls below the **3:1** threshold for a boundary used to identify a control. The implementation token `control-border` reaches **4.23:1** against paper and **3.80:1** against the index. Keep the lighter decorative row rules. The offset `{colors.focus}` outline reaches **6.94:1** on paper and **6.24:1** on the index. Leave a surface-colored gap around the solid button so the ring is visible. [WCAG 2.2 non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

## Typography

Inter carries the explanatory prose and controls. IBM Plex Mono makes small technical strings easy to pick out in a list. Keep product and technology names in their original spelling. The compact feature uses 14px Inter for the requirements so “React · TypeScript · Clipboard API” fits on one line at the reference width.

| Role | Desktop | iOS | Reason |
| --- | ---: | ---: | --- |
| Featured entry | 56px | 40px | The entry name leads the spread. The phone title can wrap beside the engraving. |
| Index heading | 40px | 28px | A distinct second heading marks the start of the results. |
| Masthead wordmark | 28px | 20px | The brand stays legible alongside navigation or the menu trigger. |
| Featured description | 20px | 16px | A short explanation fits within the first screen. |
| Row title / body / action | 20px / 16px / 16px | Same | Weight distinguishes a destination from its description and controls. |
| Breadcrumbs, counts, requirements and hints | 14px | 14px | A quieter size preserves room for meaningful metadata. |

Allow up to 70 characters per prose line. Use logical alignment and natural wrapping for translation and text zoom. Inter falls back to Segoe UI or a system sans. IBM Plex Mono falls back to Consolas or monospace. Use a readable Arabic-capable sans in the Arabic locale and preserve the reading direction of technical strings.

## Layout

Use an 8px grid for spacing. An 8px gap binds an icon to its label, 16px gives controls room for text, and 24–32px separates related groups. The 1px rules and 3px focus strokes are optical details. Controls have a 48px minimum target along both axes, including the language and menu triggers.

| Landmark | Desktop · 1440 × 900 | iOS · 393 × 852 |
| --- | --- | --- |
| Masthead | 64px tall, 96px inline inset. The prototype adds a Field guide link beside Catalogue, AI workflows and language. | 64px tall, 24px inline inset. The wordmark and menu share a row. The tablet also uses the menu to keep longer translated labels readable. |
| Feature | 96px section padding. Copy on the leading side, engraving on the trailing side. | 56px section padding. Title and engraving share a row, followed by description, requirements and action. |
| Index | Begins at y = 544px. Heading and count lead, with search and category alongside. | Begins at y = 528px. Heading and count share a line. Search and category stack beneath. |
| Result | 80px row with pictogram, title, summary, category, stack and directional arrow. | 80px row with title, stack and arrow. The first result is visible at the reference size. |

The reference coordinates describe the two approved captures. Center the shell at a maximum width of `spacing.shell-max` (1440px), with the paper and index backgrounds extending to the viewport edges. Use the compact layout below 768px. At 768–1023px, keep the index controls and story steps in reading order as space permits. From 1024px, use the wide layout and its two-column story when the pinned illustration fits vertically. Let sections and rows grow with content. Mirror directional arrows and use inline-start for copy in RTL. Keep the case illustration decorative and outside the tab order.

## Elevation & Depth

The change from paper to the index band groups the collection. A 1px rule separates adjacent entries while their shared columns allow direct comparison. Keep the engraving’s hatch marks inside the artwork. Flat fills and square section edges carry the same visual hierarchy on both viewports.

## Shapes

Use a 4px radius on the filled action, search field and desktop selector so their boundaries read as controls. Masthead items, the compact category trigger and entry rows use square edges. Give the entire row one link target. The trailing arrow belongs to that link.

## Motion

| Token | Use | Rationale |
| --- | --- | --- |
| `fast` · 150ms | Hover feedback and closing a user-opened menu. | Local feedback should settle before the next keystroke. |
| `base` · 250ms | Masked hero words, section entrances and opening a panel. | A short entrance connects a change to its starting point. |
| `slow` · 400ms | Count-ups and explicit in-page jumps when animated. | A little more time makes the change legible. |
| `child-stagger` · 60ms | Space the start of adjacent word or child entrances. | A small offset follows reading order. |
| `headline-limit` · 800ms | Cap the complete headline sequence, including its last word. | The entry name is ready to read promptly in each language. |
| `scroll-scrub` · scroll progress | Hero background shift, sticky story illustration and page progress. | Linear progress follows native scroll in both directions, with automatic duration and no timed catch-up. |

Use `enter` as an element comes to rest, `exit` as it leaves, and `emphasized` for an explicit change of location. Animate only transform and opacity. Switch state colors and focus outlines immediately. Preserve the audited text colors on their opaque surfaces throughout. Word masks reveal full-strength ink. Decorative layers can fade independently.

1. **Featured entry.** On load, reveal the headline word by word in reading order. Keep one accessible heading and the full line layout from the first frame. Use the child stagger and shorten the sequence for longer translations to finish within the headline limit. As the feature scrolls out, translate its decorative background by up to one 8px unit. Keep the copy, action and artwork legible in place.
2. **Section entrances.** Once 20% of a section’s entrance group is visible (`spacing.entrance-visible-ratio`, a fraction of the observed area), fade the decorative layer and lift its children by `spacing.gutter` (24px) into place with `base` and `enter`. Offset adjacent children by 60ms. Observe the group heading or a bounded group when a section exceeds the viewport. Run each entrance once and show the final state immediately on focus or a direct anchor jump. Filtered results update together.
3. **Sticky story.** Move from **Copy code** to **Accessible UI review**, then to **Catalogue search endpoint**. Give each entry a matching visual. Pin the visual in the leading column on desktop and tablet. On a tall phone, reserve space for a compact visual above the scrolling prose. Map the distance between adjacent steps to their crossfade, so reversing scroll reverses the transition. Release the pin at the story boundary. On short screens, pair each visual with its own text in normal reading order.
4. **Progress and counts.** Scale a 3px cobalt page-progress line (`spacing.ring-width`) from inline-start using the root scroll range. Its length gives a quick sense of position from 0% at the top to 100% at the bottom. When a count first enters view, count up once to its real value within `slow`. Reserve the final number’s width and expose that value to assistive technology from the start. Filtering updates the count immediately and announces the final result once.
5. **Navigation and controls.** Hide the masthead on downward scroll and reveal it on upward scroll. Keep it visible at the top, while a menu is open or while focus is inside it. A keyboard move to the masthead must reveal it immediately. Mark the current section with the cobalt underline and `aria-current="location"` on its in-page link. Keep visible hover, press and keyboard-focus cues on every interactive control. Release sticky filters at the index boundary and restore focus to the trigger when a panel closes.

Use native scroll and view timelines for continuous effects. A native `ScrollTimeline` can drive story opacity from offsets measured between the three steps. Browsers without that timeline can derive the same opacity from scroll position on the next animation frame. Use Intersection Observer to start count-ups and unobserve completed entrances. Keep the complete story readable when observers or scripting are unavailable.

**Reduced motion.** Under `prefers-reduced-motion: reduce`, render the complete headline, final numbers and entrance end states immediately. Lay out all story visuals with their steps, keep the hero background still and the masthead visible, and use instant anchor navigation. Show page progress as a plain percentage that updates in place. Preserve focus, active-section highlighting, expanded state, result announcements and keyboard order, including when the preference changes during use.

## Voice & Content Strategy

Name the reusable item, describe what it does and show the tools it requires. Use sentence case for “Copy code”, “All entries” and “All categories”. **Open component** names the destination and distinguishes opening an entry from copying its source. “AI workflows” gives the navigation destination a meaning before a visitor opens it. When a filter yields zero results, name the query and offer to clear the filter.

## Components

The unsuffixed front-matter entry is the default. Variant entries override the listed properties and keep the base dimensions and typography. Treat `active` as the moment of a press. A current page or selected value persists after release. Keyboard focus adds an immediate 3px `focus` outline, offset 3px, around the whole target even when it is also hovered, pressed or selected.

| Component | Default | Hover | Active | Focus | Disabled |
| --- | --- | --- | --- | --- | --- |
| `primary-action` | One 200 × 48px cobalt link to the featured entry, with a white label and arrow. | Darken the fill. | Use the deepest blue until release. | Ring outside the button. | Muted label on the rule-colored fill. Remove navigation. |
| `masthead-action` | Ink on paper for navigation, language and the compact menu. A cobalt underline and current-page semantics identify Catalogue. | Cobalt label or icon. | Deep blue label or icon. | Ring around the full target. | Muted, with activation unavailable. |
| `search-field` | Paper fill, control border, magnifier, muted 14px hint and ink query. Give the field a persistent accessible name. | Use a cobalt border. | Use a deep blue border. | Ring around the field and show the text caret. | Muted value and hint on the rule-colored fill. |
| `category-select` | Paper fill, control border, selected value and chevron. | Use a cobalt border. | Deepen the border during press. | Ring around the selector. | Muted value on the rule-colored fill. |
| `compact-category` | Label and chevron sit directly on the index. The label always names the current selection. | Cobalt label and chevron. | Deep blue label and chevron. | Ring around both. | Muted label. The selector cannot open. |
| `entry-row` | Ink title, muted details and one cobalt link arrow across the row. | Underline the title and turn it cobalt. | Use deep blue on the title and arrow. | Outline the entire row. | Use muted text, omit the link arrow and render a static row. |

Opening a menu exposes its expanded state. Selecting a category updates the label, count and results together. Keep disabled controls at full color opacity and expose disabled semantics. Rows for published entries lead to their own pages. If a proposed entry is shown, label it **Planned** until its example runs.

## Do's and Don'ts

Keep one filled action per viewport. Show requirements where the developer decides whether to open an entry. Keep controls, result text and focus targets in place while state colors change. An empty search, a longer translation or larger text should be able to use more vertical space without covering another control.
