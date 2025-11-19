import { Check } from 'lucide-react';

import { Policy } from '@/services/api.service';

interface PolicyListProps {
  policies: Policy[];
  selectedPolicy: Policy | null;
  onSelectPolicy: (policy: Policy) => void;
}

export default function PolicyList({ policies, selectedPolicy, onSelectPolicy }: PolicyListProps) {
  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden h-full w-full'>
      <div className='flex flex-col p-4 gap-3'>
        <div className='mx-2 text-xs font-semibold text-slate-900 uppercase tracking-wide'>Policies</div>
        {policies.map((policy) => (
          <button
            key={policy.id}
            onClick={() => onSelectPolicy(policy)}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              selectedPolicy?.id === policy.id
                ? 'bg-primary/20 border border-primary/50 shadow-lg shadow-primary/10 text-foreground'
                : 'bg-card border border-gray-300 hover:bg-primary/10 hover:border-primary/30 text-card-foreground'
            }`}>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold truncate'>{policy.name}</p>
                <p className='text-xs text-muted-foreground line-clamp-1'>{policy.description}</p>
              </div>
              {selectedPolicy?.id === policy.id && <Check className='w-4 h-4 text-primary flex-shrink-0 mt-0.5' />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
