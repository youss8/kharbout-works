# Copy code

Use this component in a React project with TypeScript, JSX and a bundler that supports CSS imports. Copy the included `resources` directory into your project root. The relative import in the component points to the included stylesheet.

From a TSX file in your project root, render the button alongside the same snippet you pass as its `code` prop.

```tsx
import CopyCodeButton from './resources/js/components/CopyCodeButton';

export default function Snippet() {
    const code = 'const book = "The Lantern Atlas";';
    return (
        <section>
            <CopyCodeButton label="JavaScript" code={code} />
            <pre><code>{code}</code></pre>
        </section>
    );
}
```

Open the page over HTTPS or localhost. Tab to **Copy JavaScript**, press Enter and paste into an editor. The result should match the visible snippet. If clipboard permission is denied, the button reports the failure and the code stays selectable.
