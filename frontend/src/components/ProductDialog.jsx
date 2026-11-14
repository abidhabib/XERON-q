/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react';

// Native dialogs trap focus, support Escape, and return focus to the opener.
export default function ProductDialog({ children, onClose, titleId, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-0 p-0 shadow-2xl backdrop:bg-black/60">
    <div className="max-h-[85dvh] overflow-y-auto" onClick={event => event.stopPropagation()}>{children}</div>
  </dialog>;
}
