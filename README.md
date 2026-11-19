# Youssef's Operations Kit

A collection of reusable components, pages, workflows, JavaScript utilities and AI skills for people building software. Each entry will explain what you can take into your own project, which dependencies come with it and how to check that it works after you change it.

## First collection under consideration

**Requests and Approvals** starts with a fictional equipment purchase. Someone requests a monitor, a reviewer records a decision, and the requester can see the outcome. The same example gives developers several pieces they can use independently.

| Planned entry | What you could use in your own project |
| --- | --- |
| Shareable table filters | A TypeScript utility that remembers a review queue's filters in the URL and restores them when you open the link. |
| Decision dialog | A React component for recording an approval or a reason for declining, with keyboard and right-to-left examples. |
| Review queue | A responsive page showing requests that need attention, including what happens when filters match nothing. |
| Approval workflow | A Laravel implementation that checks who can decide, records the outcome once and notifies the requester. |
| Claude skill | A repeatable review of a workflow's permission rules with a worked example. |
| Gemini Gem guide | Instructions for turning a workflow description into acceptance criteria, including an example input and output. |

## Project status

The repository currently contains the project brief and contribution guidance. Implementation and runnable demos are ahead. The planned demo stack is Laravel, Inertia, React, strict TypeScript, MySQL and Redis. Each entry will list its own requirements. The demo will support Arabic, English and German.

Read the [contributing guide](CONTRIBUTING.md) to propose an entry. The kit uses the [MIT License](LICENSE).
