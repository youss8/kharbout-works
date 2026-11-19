# 0002 · Publish entries from versioned source

The first catalogue is public and read-only. Entry metadata, example code and test cases should travel together when a maintainer reviews a change.

Keep the public registry in PHP and derive the Browse and Entry payloads from it. Route lookups use a fixed list of slugs. React renders a recipe selected from the known implementations. The downloadable or copyable example lives in the repository, and source previews read that same file at build time.

A database-backed CMS would enable editing outside Git, but introduces content storage, permissions and migrations before an editor needs them. For this release the cost of the source-based approach is a rebuild when content changes. Revisit this decision when a concrete publishing workflow calls for it.
