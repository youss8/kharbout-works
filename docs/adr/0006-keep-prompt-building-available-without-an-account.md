# Keep prompt building available without an account

Visitors need to draft and export prompts even when they cannot sign in or the model budget is exhausted. The Prompt Builder uses the static Astro workbench and compiles prompts in the browser. Versioned workflow definitions supply the form, examples, output sections, and review checks. Assistant profiles adjust the generated text for the destination. IndexedDB holds device drafts and favorites, and the text editor and export controls remain available when browser storage fails.

Requiring accounts for the whole workspace would make drafting depend on email delivery. Asking visitors for provider keys would add setup to the AI workbench and make it harder to offer the same workflow to everyone. Supabase is optional for the builder and handles account sign-in, versioned cloud drafts, folder access, and expiring snapshots. Edge Functions authenticate model requests and reserve spending in Postgres before calling the provider. Operators can pause model calls while the rest of the builder stays available.

Public snapshot lookups return only the title and prompt for a valid, unexpired token. Library operations execute through database functions whose grants and role checks limit access to drafts and folders. Invite tokens and model usage tables have row-level security and no direct client grants. The staging database tests exercise the allowed roles and confirm that expired or revoked links cannot be opened.

Host the staging frontend on a protected Vercel preview and give it a separate Supabase project. Production needs its own project, email configuration, and model credentials. Each deployment enables the builder with a build setting. [Prompt Builder release guide](../prompt-builder.md)
