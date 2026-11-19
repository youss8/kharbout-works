# 0003 · Build source bundles from published files

Visitors need the files behind a working preview, including its dependencies and instructions. A hand-built release ZIP would need to be updated every time the example changes.

Laravel resolves the entry slug, then builds a ZIP from its explicit file list and the repository license. Archive names preserve the layout required by the example. PHP's Phar extension handles ZIP creation. This keeps the public route independent of an asset host or database and ties each download to the deployed source tree.

Building on demand costs a small amount of I/O per download. The entries are small and public. If their size or download volume grows, the same manifest can feed a build-time packaging step.
