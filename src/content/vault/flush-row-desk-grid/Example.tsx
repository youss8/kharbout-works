import { useReducer, useRef, useState, type CSSProperties } from 'react';
import grid from './model';
import './style.css';

export default function Example() {
    const [desk] = useState(grid),
        [, refresh] = useReducer((n) => n + 1, 0);
    const root = useRef<HTMLDivElement>(null);
    function act(fn: () => void) {
        fn();
        refresh();
    }
    return (
        <section
            className="kit-panel"
            onKeyDown={(e) => {
                if (e.key === 'Escape' && desk.editing) act(() => desk.cancel());
            }}
        >
            <div className="kit-row">
                {desk.editing ? (
                    <>
                        <button onClick={() => act(() => desk.save())}>Done</button>
                        <button onClick={() => act(() => desk.cancel())}>Cancel</button>
                        <button onClick={() => act(() => desk.reset())}>
                            Reset to role default
                        </button>
                    </>
                ) : (
                    <button onClick={() => act(() => desk.customize())}>Customize grid</button>
                )}
            </div>
            {desk.editing && (
                <p>Drag a header or use arrow keys to swap. Shift + arrow resizes a panel.</p>
            )}
            <div ref={root} className="desk-layout">
                {desk.rows.flat().map((p) => (
                    <article
                        key={p.panel}
                        data-grid-panel
                        style={{ '--span': p.cols } as CSSProperties}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            act(() => desk.swap(desk.drag, p.panel, root.current!));
                        }}
                    >
                        <header>
                            <button
                                aria-label={'Move ' + p.title}
                                disabled={!desk.editing}
                                draggable={desk.editing}
                                onDragStart={(e) => {
                                    desk.drag = p.panel;
                                    e.dataTransfer.setData('text/plain', p.panel);
                                }}
                                onKeyDown={(e) =>
                                    act(() => desk.keys(e.nativeEvent, p.panel, root.current!))
                                }
                            >
                                {p.title}
                            </button>
                            <bdi>{p.cols}/12</bdi>
                        </header>
                        {desk.editing && (
                            <div className="kit-row">
                                <button
                                    disabled={!desk.canSize(p.panel, -2)}
                                    aria-label={'Shrink ' + p.title}
                                    onClick={() => act(() => desk.size(p.panel, -2, root.current!))}
                                >
                                    −2
                                </button>
                                <button
                                    disabled={!desk.canSize(p.panel, 2)}
                                    aria-label={'Grow ' + p.title}
                                    onClick={() => act(() => desk.size(p.panel, 2, root.current!))}
                                >
                                    +2
                                </button>
                                <button
                                    className="grip"
                                    aria-label={'Drag to resize ' + p.title}
                                    onPointerDown={(e) =>
                                        desk.edgeStart(
                                            e.nativeEvent,
                                            p.panel,
                                            root.current!,
                                            e.currentTarget,
                                            refresh,
                                        )
                                    }
                                    onKeyDown={(e) =>
                                        act(() => desk.keys(e.nativeEvent, p.panel, root.current!))
                                    }
                                >
                                    ↔
                                </button>
                            </div>
                        )}
                    </article>
                ))}
            </div>
            <output>{desk.monitor}</output>
            <p role="status">{desk.notice}</p>
        </section>
    );
}
