import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';

interface CopyableIdProps {
  id: string;
  truncateLength?: number;
  className?: string;
}

type CopyState = 'idle' | 'copied' | 'error';

export function CopyableId({ id, truncateLength = 8, className }: CopyableIdProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [isHovered, setIsHovered] = useState(false);

  const truncatedId = id.length > truncateLength ? `${id.substring(0, truncateLength)}...` : id;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  const handleClick = () => {
    if (copyState === 'idle') {
      copyToClipboard();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && copyState === 'idle') {
      e.preventDefault();
      copyToClipboard();
    }
  };

  const getIcon = () => {
    switch (copyState) {
      case 'copied':
        return <Check className='h-4 w-4 text-green-600' />;
      case 'error':
        return <X className='h-4 w-4 text-red-600' />;
      default:
        return (
          <Copy
            className={cn(
              'h-4 w-4 text-gray-400 transition-opacity duration-200',
              isHovered ? 'opacity-100' : 'opacity-0',
            )}
          />
        );
    }
  };

  const getTooltipContent = () => {
    if (copyState === 'copied') {
      return 'Copied!';
    }

    return 'Copy to clipboard';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role='button'
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'inline-flex items-center gap-2 px-2 py-1 -mx-2 -my-1 rounded transition-colors duration-200',
            'hover:bg-gray-50 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
            className,
          )}
          aria-label='Copy user ID to clipboard'>
          <span
            className={cn(
              'text-xs font-mono transition-colors duration-200',
              'text-gray-500 group-hover:text-gray-700',
            )}>
            {truncatedId}
          </span>
          {getIcon()}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className='text-xs'>{getTooltipContent()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
