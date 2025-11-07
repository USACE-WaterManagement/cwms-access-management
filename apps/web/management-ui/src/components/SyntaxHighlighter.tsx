import { useEffect, useRef } from 'react';
import hljs from '../utils/highlightjs-setup';

interface SyntaxHighlighterProps  {
  code: string,
  className: string 
}

export default function SyntaxHighlighter({ code, className }: SyntaxHighlighterProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (ref.current) {
      hljs.highlightElement(ref.current);
    }
  }, []);

  return (
    <pre>
      <code ref={ref} className={className}>{code}</code>
    </pre>
  );
}
