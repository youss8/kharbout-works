# Prompt Builder

Open [/ai-kit/prompt-builder/](http://localhost:4321/ai-kit/prompt-builder/) while running `npm run dev`. Choose a workflow, load its fictional example, and try both prompt variants. Device drafts, presets, and favorites use IndexedDB. The language selection uses browser storage. Saving to a shared folder makes the full draft, including any results kept in it, available to that folder. A read-only link contains only the title and prompt shown in the share preview.

## Target the assistant you use

Select **Target model or assistant** before copying the prompt. The profile changes section order, formatting, and any applicable model or tool guidance. **How to use this profile** links to the provider’s official guide and describes settings that belong in the host or API. The builder supports a portable default, general chat and reasoning models, self-hosted Llama and Qwen, research with Perplexity, and separate profiles for the Microsoft and GitHub Copilot products, Codex, and Claude Code.

Use **Response preferences** to supply source references, observable acceptance criteria, or an example answer. When the answer format is JSON, the example must be a valid JSON object to be included. Provider-native schema settings are configured in the destination API. Claude input text is escaped inside XML sections so pasted markup stays within its field. Changing the target preserves manual prompt edits until you regenerate the edited variant.

For API output configuration, consult the documentation for the selected model and endpoint. [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) · [Claude Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · [Gemini structured outputs](https://aistudio.google.com/docs/structured-output) · [DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode/)

The built-in AI workbench runs GPT-5.4 mini. Paste a profile’s generated prompt into its intended assistant to evaluate another model. To generate benchmark fixtures, run `node scripts/prompt-builder-eval.mjs --profile=claude`, replacing the ID with the target profile. The script’s live runner uses the default GPT settings and accepts the portable and ChatGPT/GPT profiles.

## Private release stages

| Stage | Acceptance |
| --- | --- |
| Build the prompt editor | Generate, edit, regenerate, copy, and export both variants with exact text. |
| Add presets and workflow chains | Find all eight presets from command search and confirm the facts passed between steps in both chains. |
| Add the cloud library | Verify email sign-in, cross-device conflicts, version restore, folder roles, link expiry and revocation, and account deletion. |
| Add AI runs and comparison | Verify explicit transfer confirmation, structured suggestions, two-run comparison, timeouts, quotas, and the site-wide pause. |

Follow these stages in private and enable the public route, links, and search entries together. Vercel and Cloudflare builds require `PROMPT_BUILDER_ENABLED=true` to include the feature. Set `PROMPT_BUILDER_ENABLED=false` explicitly on any host when the feature should be absent. The local build includes it by default. Use host access controls for private staging.

## Cloud setup

Use a Vercel Preview deployment protected with Vercel Authentication for private review. Give that preview its own Supabase project and environment values. Configure production separately after the staging checks pass. [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection) · [Supabase environment setup](https://supabase.com/docs/guides/deployment)

1. Create separate Supabase projects for staging and production. Apply the migrations in `supabase/migrations` and deploy the `prompt-ai` and `prompt-account` Edge Functions with JWT verification enabled.
2. Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Astro build environment. Cloud controls stay unavailable when either value is missing.
3. Set `PROMPT_BUILDER_ORIGINS` on the Edge Functions to a comma-separated list of exact web origins. Set `OPENAI_API_KEY` as an Edge Function secret. Set the Supabase Auth site URL to the deployment, configure custom SMTP, set code expiry to 600 seconds, and use the email code template in `supabase/templates`. [Supabase SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp)
4. Test real delivery to a separate staging email address, save and reload a draft in two sessions, and test owner, editor, and viewer access as distinct users. Open an active snapshot in a signed-out browser and confirm that revocation makes it unavailable.
5. Enable model calls on staging with `update public.prompt_ai_settings set enabled = true where id;`. The default is ten calls per verified account per UTC day and US $25 of reserved or reconciled model usage per UTC month. Verify the limit and pause behavior before enabling calls on production. An upstream failure with unknown billing retains its reservation for the current month. Use the same statement with `enabled = false` to pause model calls.

## Verification

```sh
npm test
npm run check
npm run build
npm run test:workbench -- tests/workbench/prompt-builder.spec.mjs tests/workbench/ai-kit.spec.mjs tests/workbench/ask.spec.mjs
```

Run `tests/database/prompt-builder.sql` in a local Supabase database after applying the migrations. Its fixtures run in a transaction and are rolled back. For browser testing with simulated cloud responses, serve Astro on loopback with `PUBLIC_SUPABASE_URL=https://prompt-test.supabase.co` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test`, then run `tests/workbench/prompt-builder-cloud.spec.mjs` with `PLAYWRIGHT_PROMPT_CLOUD=1` and `PLAYWRIGHT_WORKBENCH_URL` set to the local server.

Generate the eight benchmark pairs with `node scripts/prompt-builder-eval.mjs`. Add `--ar` for Arabic. With a staging provider key in the environment, add `--run` to send the fictional examples, collect both answers and score them against the same criteria. Save the JSON report with the staging release notes and review the scores against the answers. A worked example stays **Planned** for its selected profile and language until a completed pair is recorded.

## Recorded benchmark results

On 25 November 2026, the plain request and builder prompt for each fixture were submitted separately to the same assistant with the same source facts. GPT-5.6 Sol scored the completed pairs against the shared rubric and each workflow's checks, with answer order alternated between fixtures. Each score is the number of checks met in this run.

| Profile and model | Language | Completed pairs | Plain request | Builder prompt |
| --- | --- | ---: | ---: | ---: |
| Codex · GPT-5.6 Sol | English | 8 of 8 | 47 / 49 | 49 / 49 |
| Qwen · Qwen3 8B via Ollama | English | 8 of 8 | 40 / 49 | 46 / 49 |
| Claude Code · Claude Haiku 4.5 | English | 2 of 8 | 12 / 12 | 11 / 12 |
| Codex · GPT-5.6 Sol | Arabic | 8 of 8 | 39 / 49 | 49 / 49 |
| Qwen · Qwen3 8B via Ollama | Arabic | 8 of 8 | 39 / 49 | 36 / 49 |

The Qwen run used the local 8B checkpoint with thinking disabled. In Arabic, its builder answers scored lower for summarizing notes, drafting meeting follow-up, and reviewing a pull request. These are single runs with the detailed variant. Claude Code completed the email and note-summary pairs before the configured provider returned a credit limit. The builder displays the recorded model for completed examples when the loaded example and answer use the same language. [Per-workflow scores](../src/lib/prompt-builder/example-runs.json)

## Production monitoring

After launch, use the following query to review event counts, latency, and usage. Its input contains timing, outcome, and cost metadata.

```sql
select date_trunc('day', created_at, 'UTC') as day,
       action, status, count(*) as calls,
       percentile_cont(0.95) within group (order by duration_ms) as p95_ms,
       sum(coalesce(actual_micros, reserved_micros)) / 1000000.0 as reserved_or_billed_usd
from public.prompt_ai_usage
where created_at >= now() - interval '7 days'
group by 1, 2, 3
order by 1 desc, 2, 3;
```
