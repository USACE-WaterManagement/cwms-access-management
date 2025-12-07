import { useEffect, useMemo, useRef } from 'react';

import hljs from '../utils/highlightjs-setup';

interface SyntaxHighlighterProps {
  code: string;
  className?: string;
  showLineNumbers?: boolean;
}

export default function SyntaxHighlighter({
  code,
  className = 'language-rego',
  showLineNumbers = true,
}: SyntaxHighlighterProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = code; // Set text content safely to prevent XSS
      ref.current.removeAttribute('data-highlighted'); // Remove existing highlighting classes before re-highlighting
      hljs.highlightElement(ref.current);
    }
  }, [code]);

  const lineNumbers = useMemo(() => {
    return code.split('\n').map((_, i) => i + 1);
  }, [code]);

  return (
    <div className='flex h-full font-mono rounded-xl text-sm bg-[#22272e] overflow-auto'>
      {showLineNumbers && (
        <div
          className='shrink-0 flex flex-col items-end select-none text-slate-400 py-4 pr-3 pl-4'
          aria-hidden='true'>
          {lineNumbers.map((num) => (
            <span
              key={num}
              className='leading-6'>
              {num}
            </span>
          ))}
        </div>
      )}

      <div className='grow'>
        <pre className='m-0 p-0'>
          <code
            ref={ref}
            className={`block leading-6 p-4 ${className}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
