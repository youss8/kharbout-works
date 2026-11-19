# 0001 · Serve the catalogue through Laravel and Inertia

**Decision.** Laravel owns the public URLs for browsing the catalogue and viewing an entry. Each route returns a named Inertia page. React renders that page, and TypeScript checks its inputs at build time.

**Why.** A visitor can open or share an entry URL directly. Inside the catalogue, Inertia links use the same Laravel routes for navigation. This gives the project one route definition per page and keeps future server-side validation and authorisation in Laravel.

**Trade-off.** A separate API and client router could support independently deployed clients. The first release has one web client. Keeping both ends in one application makes the request path small enough to trace from a route to a React component.

**Scope.** The base needs a public catalogue and one sample entry. It can serve both from versioned source. Add persistence when an entry needs to save data or a contributor needs an editing workflow.
