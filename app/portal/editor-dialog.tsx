"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function EditorDialog({ title, locked, close, children }: {
  title: string; locked: boolean; close: () => void; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog className="editor-dialog" ref={ref} aria-label={title} onCancel={event => {
    event.preventDefault();
    if (!locked) close();
  }}>
    <div className="editor-dialog-inner">
      <header className="editor-dialog-heading">
        <h2>{title}</h2>
        <button type="button" aria-label="Close dialog" disabled={locked} onClick={close}>×</button>
      </header>
      {children}
    </div>
  </dialog>;
}
