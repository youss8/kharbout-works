import type { APIRoute } from 'astro';
import license from '../../../../LICENSE?raw';
import parserTypes from '../../../lib/kernels/cleanForWrite.ts?raw';
import parser from '../../../lib/kernels/safeCsv.ts?raw';
import adapter from '../../../lib/tools/csv-test-pack-adapter.mjs?raw';
import { createCsvTestScaffold } from '../../../lib/tools/csv-test-pack-archive';

export const GET: APIRoute = async () => {
    const scaffold = createCsvTestScaffold({ adapter, parser, parserTypes, license });
    const bytes = await scaffold.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
    return new Response(bytes, { headers: { 'Content-Type': 'application/zip' } });
};
