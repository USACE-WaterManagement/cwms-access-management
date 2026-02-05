import { useEffect, useRef, useState } from 'react';
import { Check, Copy, FileCode, FileKey, Workflow } from 'lucide-react';

import SyntaxHighlighter from './SyntaxHighlighter';

import { Button } from '@/components/ui/button';
import { Policy } from '@/services/api.service';
interface PolicyCardProps {
  policy: Policy;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(policy.rules.raw);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard. Please try again.');
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='bg-white rounded-xl shadow-sm p-8 border border-gray-300'>
        <div className='flex flex-col mb-3 gap-4'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <div className='p-3 bg-gradient-to-br from-blue-600 to-blue-700 shadow-md rounded-lg'>
                <FileCode
                  className='w-4 h-4 text-white'
                  aria-hidden='true'
                />
              </div>
              <div className='space-y-1'>
                <h3 className='text-xl font-bold text-slate-900'>{policy.name}</h3>
                <p className='text-sm max-w-xl text-gray-500 leading-relaxed'>{policy.description}</p>
              </div>
            </div>

            <div className='flex items-center gap-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-md'>
              <Workflow className='w-5 h-5' />
              <span className='font-semibold'>
                {policy.rules.ast.rules.length} {policy.rules.ast.rules.length === 1 ? 'Policy' : 'Policies'}
              </span>
            </div>
          </div>

          <div className='rounded-lg shadow-sm p-4 bg-gray-50 border border-gray-300'>
            <div className='flex items-center gap-2 mb-2'>
              <FileKey
                className='w-4 h-4 text-gray-600'
                aria-hidden='true'
              />
              <p className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Policy ID</p>
            </div>
            <p className='text-md font-semibold text-slate-900 truncate'>{policy.id}</p>
          </div>
        </div>
      </div>

      <div className='flex flex-col bg-white relative px-5 py-6 rounded-xl shadow-sm border border-gray-300 overflow-hidden h-[calc(100vh-400px)] min-h-[400px] max-h-[800px]'>
        <div className='flex items-center justify-between flex-shrink-0 mb-4'>
          <p className='text-sm font-semibold text-slate-900 uppercase tracking-wide'>Policy Code</p>
          <Button
            className='mr-1'
            variant='outline'
            size='icon'
            onClick={handleCopy}
            title='Copy to clipboard'
            aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}>
            {copied ? (
              <Check
                className='w-4 h-4'
                aria-hidden='true'
              />
            ) : (
              <Copy
                className='w-4 h-4'
                aria-hidden='true'
              />
            )}
          </Button>
        </div>
        <SyntaxHighlighter code={policy.rules.raw} />
      </div>
    </div>
  );
}
