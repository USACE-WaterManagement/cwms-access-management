import { useEffect, useRef } from 'react';

import hljs from '../utils/highlightjs-setup';

interface SyntaxHighlighterProps {
  code: string;
  className: string;
}

export default function SyntaxHighlighter({ code, className }: SyntaxHighlighterProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = code; // Set text content safely to prevent XSS
      ref.current.removeAttribute('data-highlighted'); // Remove existing highlighting classes before re-highlighting
      hljs.highlightElement(ref.current);
    }
  }, [code]);

  return (
    <pre>
      <code
        ref={ref}
        className={className}
      />
    </pre>
  );
}
