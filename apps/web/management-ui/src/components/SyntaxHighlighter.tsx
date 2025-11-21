import { useEffect, useRef } from 'react';

import hljs from '../utils/highlightjs-setup';

interface SyntaxHighlighterProps {
  code: string;
  className: string;
  showLineNumbers?: boolean;
}

export default function SyntaxHighlighter({ code, className, showLineNumbers = true }: SyntaxHighlighterProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = code; // Set text content safely to prevent XSS
      ref.current.removeAttribute('data-highlighted'); // Remove existing highlighting classes before re-highlighting
      hljs.highlightElement(ref.current);

      if (showLineNumbers) {
        addLineNumbers(ref.current);
      }
    }
  }, [code, showLineNumbers]);

  return (
    <pre>
      <code
        ref={ref}
        className={className}
      />
    </pre>
  );
}

function addLineNumbers(element: HTMLElement) {
  const html = element.innerHTML;
  const lines = html.split('\n');

  element.innerHTML = lines
    .map(
      (line, index) =>
        `<span class="flex gap-5">
        <span class="w-8 shrink-0 text-right text-slate-500 select-none">${index + 1}</span>
        <span>${line || ' '}</span>
      </span>`,
    )
    .join('');
}
