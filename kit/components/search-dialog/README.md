# Keyboard search dialog

Use the standalone reading list to try the component before adding it to a project.

## Run the example

1. Extract the ZIP into an empty directory. Open a terminal in the directory containing `package.json`.
2. With Node.js 24 and npm installed, run `npm ci` and then `npm run dev`.
3. Open the local URL Vite prints. To create a production build, stop the server with Ctrl+C and run `npm run build`. Vite writes the site to `dist/`.

Tab to **Search reading list** and press Enter. The search field should have focus. Type **harbour**, then press Enter. The page should display **The Lantern Atlas**. Reopen the dialog with Ctrl+K or Cmd+K, search for **zzz**, and press Escape. The dialog should close and focus should return to the control you used before opening it. Reopen it with an empty query and use the arrow keys to choose a different book.

## Use it in your own project

Copy `SearchDialog.tsx` and `search-dialog.css` into the same directory in a React project with TypeScript, TSX and CSS imports. The example uses React 19, React DOM 19 and Vite 8. The browser must support the HTML `dialog` element and `showModal()`.

See `Example.tsx` for a complete host. Pass a synchronous `search(query)` function returning an ordered array of `{ id, title, description }` objects. Use a stable, unique string for each ID. An empty query can return suggestions. Return an empty array when there are no matches. The host supplies its own data and decides whether selecting a result updates the page, navigates or performs another action.

Keep `open` in the host. Set it to true from a button marked `aria-haspopup="dialog"` or from your app's shortcut handler. Pass `onClose` to clear `open` and `onSelect` to handle the chosen result. The dialog requests a close before calling `onSelect`. The component handles the arrow keys, Enter and Escape once open, then restores focus if the original control still exists.

Register Ctrl+K and Cmd+K once in the host application. The standalone page enables the handler in `Example.tsx` with `ownsShortcut`. The embedded catalogue preview leaves that flag off because its shell owns the shortcut. Use the optional `labels` prop to supply the title, input, close and empty-state text in your language. The dialog inherits the document's reading direction.

Keep the included MIT license notice with copies.
