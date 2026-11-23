# Serve the engineering workbench as a static Astro site

The public workbench needs printable HTML, locally hosted examples and an export that can be deployed on both Vercel and Cloudflare Pages. The existing Laravel/Inertia catalogue includes PHP routes and source-archive downloads that still need a server.

Astro now owns the default frontend development and build commands. Its collections validate case studies, vault entries, prompts and templates. React and Alpine implement local interactions using synthetic data. The vault compiles the React source shown in each code tab, and the Alpine frame runs the displayed HTML. This keeps each live demonstration tied to the code a visitor can reuse.

Serving the workbench through Laravel would require a PHP runtime for every deployment. Keeping the Laravel catalogue as a separate entry point preserves its existing routes and downloads. Its Vite assets go into `public/build/` through `npm run build:catalogue`. The Docker image continues to serve that application.

The static build copies only its favicon, robots policy and optional portrait from the shared public directory. It generates local raw source downloads from the two public starter collections. Developers verify the resulting `dist/` through a separate Playwright configuration, including PDF pagination and text extraction.
