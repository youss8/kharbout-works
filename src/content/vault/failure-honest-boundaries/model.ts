import { escapeCsvCell, toCsv } from '../../../lib/kernels/safeCsv';
export default function createBoundary() {
    let request = 0;
    return {
        loading: false,
        error: '',
        revision: 1,
        csvCell: '=SUM(A1:A9)',
        rows: ['Laptop LT-01', 'جهاز طباعة'],
        get escaped() {
            return escapeCsvCell(this.csvCell);
        },
        async fetchRows(delay: number, fail = false) {
            const id = ++request;
            this.loading = true;
            this.error = '';
            await new Promise((resolve) => setTimeout(resolve, delay));
            if (id !== request) return;
            this.loading = false;
            if (fail) {
                this.error = 'The inventory query timed out. Previous rows are shown.';
                return;
            }
            this.revision++;
            this.rows =
                this.revision % 2
                    ? ['Laptop LT-01', 'جهاز طباعة']
                    : ['Laptop LT-01', 'جهاز طباعة', 'Dock DK-04'];
        },
        download() {
            const text = toCsv([
                ['Item', 'Notes'],
                ...this.rows.map((r, i) => [r, i === 0 ? this.csvCell : '+24 units']),
            ]);
            const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'inventory.csv';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        destroy() {
            request++;
        },
    };
}
