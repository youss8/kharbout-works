import workbookUrl from './sample.xlsx?url';
import documentUrl from './sample.docx?url';
import pdfUrl from './sample.pdf?url';
import archiveUrl from './sample.zip?url';
import type { readWorkbook } from './office-reader';
type Workbook = Awaited<ReturnType<typeof readWorkbook>>;
type FileEntry = { name: string; url: string; file?: File };
const samples: FileEntry[] = [
    { name: 'q3-budget.xlsx', url: workbookUrl },
    { name: 'grant-brief.docx', url: documentUrl },
    { name: 'review.pdf', url: pdfUrl },
    { name: 'archive.zip', url: archiveUrl },
];
export default function createViewer() {
    let version = 0,
        workbook: Workbook | null = null;
    const ownedUrls: string[] = [];
    return {
        files: [...samples],
        index: 0,
        sheet: 0,
        sheets: [] as string[],
        rows: [] as string[][],
        documentHtml: '',
        standaloneUrl: '',
        totalRows: 0,
        totalCols: 0,
        kind: '',
        error: '',
        loading: false,
        opened: false,
        get current() {
            return this.files[this.index];
        },
        get clipped() {
            return this.totalRows > 500 || this.totalCols > 50;
        },
        async open() {
            this.opened = true;
            document.querySelector<HTMLDialogElement>('#office-modal')!.showModal();
            await this.load(this.index);
        },
        close() {
            this.opened = false;
            version++;
            this.loading = false;
            document.querySelector<HTMLDialogElement>('#office-modal')?.close();
        },
        async add(list: FileList | null) {
            if (!list?.length) return;
            const added = Array.from(list).map((file) => {
                const content = /\.pdf$/i.test(file.name)
                    ? new Blob([file], { type: 'application/pdf' })
                    : file;
                const url = URL.createObjectURL(content);
                ownedUrls.push(url);
                return { name: file.name, url, file };
            });
            const index = this.files.length;
            this.files = [...this.files, ...added];
            await this.load(index);
        },
        async load(index: number) {
            const file = this.files[index];
            if (!file) return;
            const token = ++version;
            this.index = index;
            this.loading = true;
            this.error = '';
            this.kind = '';
            this.sheet = 0;
            this.rows = [];
            if (this.standaloneUrl) URL.revokeObjectURL(this.standaloneUrl);
            this.standaloneUrl = '';
            this.documentHtml = '';
            this.sheets = [];
            this.totalRows = this.totalCols = 0;
            workbook = null;
            const ext = file.name.split('.').at(-1)?.toLowerCase();
            try {
                if (ext === 'pdf') {
                    this.kind = 'pdf';
                    return;
                }
                if (ext !== 'xlsx' && ext !== 'docx') {
                    this.kind = 'unsupported';
                    return;
                }
                if (file.file && file.file.size > 20 * 1024 * 1024)
                    throw new Error('Office files are limited to 20 MB.');
                const getData = async () => {
                    if (file.file) return file.file.arrayBuffer();
                    const res = await fetch(file.url);
                    if (!res.ok) throw new Error('Sample file could not load.');
                    return res.arrayBuffer();
                };
                const [reader, data] = await Promise.all([import('./office-reader'), getData()]);
                if (token !== version) return;
                if (ext === 'xlsx') {
                    const book = await reader.readWorkbook(data);
                    const first = await book.read(0);
                    if (token !== version) return;
                    workbook = book;
                    this.sheets = book.sheets;
                    Object.assign(this, first);
                    this.kind = 'sheet';
                    this.updateStandalone();
                } else {
                    const doc = await reader.readDocument(data);
                    if (token !== version) return;
                    this.documentHtml = this.page(doc);
                    this.kind = 'document';
                    this.updateStandalone();
                }
            } catch (err) {
                if (token === version)
                    this.error = err instanceof Error ? err.message : 'File could not be read.';
            } finally {
                if (token === version) this.loading = false;
            }
        },
        moveSheet(event: KeyboardEvent, list: HTMLElement) {
            const rtl = getComputedStyle(list).direction === 'rtl';
            let index = this.sheet;
            if (event.key === 'Home') index = 0;
            else if (event.key === 'End') index = this.sheets.length - 1;
            else if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1;
                index = (index + step + this.sheets.length) % this.sheets.length;
            } else return;
            event.preventDefault();
            list.querySelectorAll<HTMLButtonElement>('[role=tab]')[index]?.focus();
            void this.chooseSheet(index);
        },
        async chooseSheet(index: number) {
            if (!workbook) return;
            const token = ++version;
            this.sheet = index;
            this.loading = true;
            this.error = '';
            try {
                const result = await workbook.read(index);
                if (token === version) {
                    Object.assign(this, result);
                    this.updateStandalone();
                }
            } catch (err) {
                if (token === version)
                    this.error = err instanceof Error ? err.message : 'Worksheet unavailable.';
            } finally {
                if (token === version) this.loading = false;
            }
        },
        page(markup: string) {
            return (
                '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; style-src &apos;unsafe-inline&apos;; img-src data:; form-action &apos;none&apos;; base-uri &apos;none&apos;"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local file preview</title><style>body{font:1rem system-ui;margin:0}td{padding:.4rem;border:1px solid #bbb}.docx-wrapper{padding:.4rem!important}.docx-wrapper>section.docx{max-width:100%;padding:1rem!important;box-sizing:border-box}</style></head><body>' +
                markup +
                '</body></html>'
            );
        },
        updateStandalone() {
            if (this.standaloneUrl) URL.revokeObjectURL(this.standaloneUrl);
            let html = this.documentHtml;
            if (this.kind === 'sheet') {
                const table = document.createElement('table');
                for (const row of this.rows) {
                    const tr = table.insertRow();
                    for (const cell of row) tr.insertCell().textContent = String(cell);
                }
                html = this.page(table.outerHTML);
            }
            this.standaloneUrl = URL.createObjectURL(
                new Blob([html], { type: 'text/html;charset=utf-8' }),
            );
        },
        destroy() {
            if (this.standaloneUrl) URL.revokeObjectURL(this.standaloneUrl);
            version++;
            ownedUrls.forEach((url) => URL.revokeObjectURL(url));
        },
    };
}
