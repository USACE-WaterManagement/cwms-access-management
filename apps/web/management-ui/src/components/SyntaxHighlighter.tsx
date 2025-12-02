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
    <pre className='h-full'>
      <code
        ref={ref}
        className={className}
      />
    </pre>
  );
}

/**
 * Adds line numbers to a syntax-highlighted code element by wrapping each line
 * in markup that includes the line number. Uses DOM manipulation to preserve
 * highlight.js nodes and avoid innerHTML security concerns.
 *
 * @param element - The code element that has been syntax highlighted
 */
function addLineNumbers(element: HTMLElement) {
  const html = element.innerHTML;
  const lines = html.split('\n');

  element.textContent = '';

  lines.forEach((lineHtml, index) => {
    const lineWrapper = document.createElement('span');
    lineWrapper.className = 'flex gap-5 line-wrapper';

    const lineNumber = document.createElement('span');
    lineNumber.className = 'w-8 shrink-0 text-right text-slate-500 select-none';
    lineNumber.textContent = String(index + 1);

    const lineContent = document.createElement('span');

    lineContent.innerHTML = lineHtml || ' ';

    lineWrapper.appendChild(lineNumber);
    lineWrapper.appendChild(lineContent);
    element.appendChild(lineWrapper);
  });
}
