import { FileCode, FileKey, Workflow } from 'lucide-react';

import SyntaxHighlighter from './SyntaxHighlighter';

import { Policy } from '@/services/api.service';
interface PolicyCardProps {
  policy: Policy;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='bg-white rounded-xl shadow-sm p-8 border border-gray-300'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex flex-col items-start justify-center gap-3'>
            <div className='flex items-center gap-3 mb-1'>
              <div className='p-3 bg-gradient-to-br from-blue-600 to-blue-700 shadow-md rounded-lg'>
                <FileCode
                  className='w-4 h-4 text-white'
                  aria-hidden='true'
                />
              </div>
              <h3 className='text-xl font-bold text-slate-900'>{policy.name}</h3>
            </div>
            <p className='text-sm max-w-xl text-gray-500 leading-relaxed'>{policy.description}</p>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='rounded-lg shadow-sm p-4 bg-gray-50 border border-gray-300'>
              <div className='flex items-center gap-2 mb-2'>
                <FileKey
                  className='w-4 h-4 text-gray-600'
                  aria-hidden='true'
                />
                <p className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Policy ID</p>
              </div>
              <p className='text-lg font-bold text-slate-900'>{policy.id}</p>
            </div>

            <div className='rounded-lg shadow-sm p-4 bg-gray-50 border border-gray-300'>
              <div className='flex items-center gap-2 mb-2'>
                <Workflow
                  className='w-4 h-4 text-gray-600'
                  aria-hidden='true'
                />
                <p className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Policies</p>
              </div>
              <p className='text-lg font-bold text-slate-900'>{policy.rules.ast.rules.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className='flex flex-col bg-white relative px-5 py-6 rounded-xl shadow-sm border border-gray-300 overflow-hidden h-[calc(100vh-400px)] min-h-[400px] max-h-[800px]'>
        <div className='flex-shrink-0 mb-4'>
          <p className='text-sm font-semibold text-slate-900 uppercase tracking-wide'>Policy Code</p>
        </div>
        <div className='overflow-auto rounded-xl h-full'>
          <SyntaxHighlighter
            code={policy.rules.raw}
            className='language-rego h-full'
          />
        </div>
      </div>
    </div>
  );
}
