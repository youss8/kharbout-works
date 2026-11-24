const decoder = new TextDecoder();
const maxPart = 12 * 1024 * 1024;
// Check the archive budget before passing the file to either document parser.
function checkPackage(buffer: ArrayBuffer, requiredPart: string) {
    const view = new DataView(buffer);
    let end = buffer.byteLength - 22;
    const limit = Math.max(0, buffer.byteLength - 65557);
    while (end >= limit && view.getUint32(end, true) !== 0x06054b50) end--;
    if (end < limit) throw new Error('Missing Office ZIP directory.');
    let at = view.getUint32(end + 16, true);
    const count = view.getUint16(end + 10, true);
    let total = 0,
        found = false;
    if (count > 4096) throw new Error('This document contains too many parts.');
    for (let i = 0; i < count; i++) {
        if (at + 46 > end || view.getUint32(at, true) !== 0x02014b50)
            throw new Error('Invalid Office directory.');
        const length = view.getUint16(at + 28, true);
        const size = view.getUint32(at + 24, true);
        total += size;
        if (size > maxPart || total > 48 * 1024 * 1024)
            throw new Error('Document expansion limit exceeded.');
        const name = decoder.decode(new Uint8Array(buffer, at + 46, length));
        found ||= name === requiredPart;
        at += 46 + length + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    }
    if (!found) throw new Error('The selected file is missing its Office document part.');
}

export async function readWorkbook(data: ArrayBuffer) {
    checkPackage(data, 'xl/workbook.xml');
    const { read, utils } = await import('xlsx');
    const book = read(data, { cellHTML: false, cellFormula: false, cellStyles: false });
    if (!book.SheetNames.length) throw new Error('The workbook has no sheets.');
    return {
        sheets: book.SheetNames,
        async read(index: number) {
            const sheet = book.Sheets[book.SheetNames[index]];
            if (!sheet) throw new Error('Unknown worksheet.');
            if (!sheet['!ref']) return { rows: [], totalRows: 0, totalCols: 0 };
            const { e } = utils.decode_range(sheet['!ref']);
            const totalRows = e.r + 1,
                totalCols = e.c + 1;
            const range = { s: { r: 0, c: 0 }, e: { r: Math.min(e.r, 499), c: Math.min(e.c, 49) } };
            const rows = utils.sheet_to_json<string[]>(sheet, {
                header: 1,
                range,
                raw: false,
                defval: '',
                blankrows: true,
            });
            return { rows, totalRows, totalCols };
        },
    };
}

export async function readDocument(data: ArrayBuffer) {
    checkPackage(data, 'word/document.xml');
    const { parseAsync, renderDocument } = await import('docx-preview');
    const options = {
        renderAltChunks: false,
        ignoreFonts: true,
        useBase64URL: true,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        ignoreWidth: true,
    };
    const documentModel = await parseAsync(data, options);
    if (!documentModel.documentPart?.body) throw new Error('The document body is missing.');
    const template = document.createElement('template');
    template.content.append(...(await renderDocument(documentModel, options)));
    // Keep passive document content. The preview frame also denies scripts, navigation and network access.
    template.content
        .querySelectorAll('iframe,object,embed,script,link,base,form,foreignObject,meta')
        .forEach((el) => el.remove());
    for (const el of template.content.querySelectorAll('*')) {
        for (const attribute of Array.from(el.attributes)) {
            const key = attribute.name.toLowerCase();
            const safeImage =
                key === 'src' &&
                el.localName === 'img' &&
                /^data:image\/(png|jpeg|gif|webp);base64,/i.test(attribute.value);
            if (
                key.startsWith('on') ||
                (['href', 'xlink:href', 'src', 'srcset', 'action', 'target'].includes(key) &&
                    !safeImage)
            )
                el.removeAttribute(attribute.name);
        }
    }
    return template.innerHTML;
}
