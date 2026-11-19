# Shareable URL filters

Copy `filters.ts` beside a TypeScript module in a project that provides the standard URL API. The helper reads `q` and `category` and builds a new URL. Your application decides when to navigate.

```ts
import { readFilters, writeFilters } from './filters';

const current = new URL(window.location.href);
const next = writeFilters(current, { ...readFilters(current), query: 'C++' });
window.history.pushState(null, '', next);
```

From the extracted directory, run the sample tests with Node.js 24.

```sh
node --test filters.test.mjs
```

The four tests cover encoding, pagination, repeated parameters and unrelated URL state.
