import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve, relative, sep } from 'node:path';

const src = resolve('src');
export type Stack = 'alpine' | 'react' | 'livewire';
export interface SourceFile {
    path: string;
    code: string;
    lang: 'html' | 'tsx' | 'typescript' | 'php' | 'blade' | 'css' | 'json' | 'javascript';
}

export function sourceFiles(id: string, stack: Stack): SourceFile[] {
    const dir = resolve(src, 'content/vault', id);
    const result: SourceFile[] = [];
    const visited = new Set<string>();
    const langs: Record<string, SourceFile['lang']> = {
        '.html': 'html',
        '.tsx': 'tsx',
        '.ts': 'typescript',
        '.php': 'php',
        '.css': 'css',
        '.js': 'javascript',
        '.json': 'json',
    };
    function add(file: string) {
        if (visited.has(file)) return;
        if (!file.startsWith(src + sep)) throw new Error('Source file outside src');
        visited.add(file);
        const code = readFileSync(file, 'utf8').replaceAll('\r\n', '\n').trimEnd();
        const path = relative(resolve('.'), file).split(sep).join('/');
        result.push({
            path,
            code,
            lang: path.endsWith('.blade.php') ? 'blade' : langs[extname(path)],
        });
        for (const match of code.matchAll(
            /(?:from\s*|import\s*(?:\(\s*)?)['"](\.\.?\/[^'"]+)['"]/g,
        )) {
            const target = resolve(dirname(file), match[1].split('?')[0]);
            const dependency = ['', '.ts', '.tsx', '.js', '.json']
                .map((ext) => target + ext)
                .find(existsSync);
            if (dependency && langs[extname(dependency)]) add(dependency);
        }
    }
    const entries =
        stack === 'alpine'
            ? ['alpine.html', 'model.ts']
            : stack === 'react'
              ? ['Example.tsx']
              : ['Example.php', 'view.blade.php'];
    for (const name of entries) add(resolve(dir, name));
    if (stack === 'livewire') {
        for (const path of ['app', 'resources', 'public']) {
            const root = resolve(dir, path);
            if (!existsSync(root)) continue;
            for (const file of readdirSync(root, { recursive: true }).map(String).sort()) {
                if (langs[extname(file)]) add(resolve(root, file));
            }
        }
    }
    if (
        stack === 'livewire' &&
        result.some((file) => file.code.includes('office-preview/register.ts'))
    )
        add(resolve(dir, 'register.ts'));
    if (existsSync(resolve(dir, 'style.css'))) add(resolve(dir, 'style.css'));
    return result;
}
