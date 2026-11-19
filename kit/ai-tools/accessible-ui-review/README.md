# Accessible UI review

Use the provided instructions to request concrete keyboard, labelling and focus checks for a component you supply. The example is synthetic and requires no external files or build step.

## Claude Code

Copy `SKILL.md` to `.claude/skills/accessible-ui-review/SKILL.md` inside the target project. Start a Claude Code session in that project and invoke `/accessible-ui-review` with a component path or snippet. [Claude Code skills](https://code.claude.com/docs/en/skills)

## Gemini

In the Gemini web app, create a Gem named **Accessible UI review**. Paste `gem-instructions.md` into its instructions, try the provided snippet in the preview, then save the Gem. Supply the component source with your request. [Google's Gem setup guide](https://support.google.com/gemini/answer/15235603)

## Verification

Try the clickable div in the example at the end of `SKILL.md`. Look for an evidence-backed finding, an actionable change and a keyboard check. Run the suggested keyboard check on your rendered page. [W3C accessibility first review](https://www.w3.org/WAI/test-evaluate/preliminary/)
