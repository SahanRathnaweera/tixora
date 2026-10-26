import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Renders children directly into <body>, so modals always cover the whole screen. */
export default function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}