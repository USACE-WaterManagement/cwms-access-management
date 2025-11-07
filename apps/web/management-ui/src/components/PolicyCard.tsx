import { Policy } from '@/services/api.service';
import { FileCode, FileKey, Workflow } from 'lucide-react';
import SyntaxHighlighter from './SyntaxHighlighter';
interface PolicyCardProps {
  policy: Policy;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
  return (
    <div className='group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300'>
      <div className='relative p-8 border-b border-slate-100'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex flex-col items-start justify-center gap-3'>
            <div className='flex items-center gap-3 mb-1'>
              <div className='p-3 bg-gradient-to-br from-blue-600 to-blue-700 shadow-md rounded-lg'>
                <FileCode className='w-4 h-4 text-white' />
              </div>
              <h3 className='text-xl font-bold text-slate-900'>{policy.name}</h3>
            </div>
            <p className='text-sm max-w-xl text-gray-500 leading-relaxed'>{policy.description}</p>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='rounded-lg shadow-sm p-4 bg-gray-50 border border-slate-200 hover:shadow-md hover:border-slate-300 hover:bg-blue-50 transition-all duration-300'>
              <div className='flex items-center gap-2 mb-2'>
                <FileKey className='w-4 h-4 text-gray-600' />
                <p className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Policy ID</p>
              </div>
              <p className='text-lg font-bold text-slate-900'>{policy.id}</p>
            </div>

            <div className='rounded-lg shadow-sm p-4 bg-gray-50 border border-slate-200 hover:shadow-md hover:border-slate-300 hover:bg-blue-50 transition-all duration-300'>
              <div className='flex items-center gap-2 mb-2'>
                <Workflow className='w-4 h-4 text-gray-600' />
                <p className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Rules</p>
              </div>
              <p className='text-lg font-bold text-slate-900'>{policy.rules.ast.rules.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className='relative p-6'>
        <div className='mb-3'>
          <div className='text-xs font-semibold text-slate-600 uppercase tracking-widest'>Policy Code</div>
        </div>
        <SyntaxHighlighter
          code={policy.rules.raw}
          className='language-rego'
        />
      </div>
    </div>
  );
}
