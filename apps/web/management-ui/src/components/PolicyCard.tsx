import { Policy } from '@/services/api.service';
import { FileCode, Workflow } from 'lucide-react';
import SyntaxHighlighter from './SyntaxHighlighter';
interface PolicyCardProps {
  policy: Policy;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
  return (
    <div className='group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300'>
      <div className='relative p-8 border-b border-slate-100'>
        <div className='flex items-start justify-between mb-3'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl ring-1 ring-blue-100/50'>
              <FileCode className='w-5 h-5 text-blue-600' />
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <span className='px-2 py-1 text-xs font-mono bg-slate-100 text-slate-700 rounded-md'>
                  ID: {policy.id}
                </span>
                <h3 className='text-xl font-bold text-slate-900'>{policy.name}</h3>
              </div>
              <p className='text-sm text-slate-600 leading-relaxed'>{policy.description}</p>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-8 mt-6 pt-6 border-t border-slate-100'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-slate-100 rounded-lg'>
              <Workflow className='w-4 h-4 text-slate-600' />
            </div>
            <div>
              <div className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Rules</div>
              <div className='text-lg font-bold text-slate-900'>{policy.rules.ast.rules.length}</div>
            </div>
          </div>

          {/* Additional rule metadata can go here */}
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
