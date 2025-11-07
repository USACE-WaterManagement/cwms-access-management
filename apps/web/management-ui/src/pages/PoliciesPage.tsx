import { useQuery } from '@tanstack/react-query';

import PolicyCard from '@/components/PolicyCard';
import { apiService } from '../services/api.service';
import { Code2 } from 'lucide-react';

export default function PoliciesPage() {
  const { data: policies, isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: () => apiService.getPolicies(),
  });

  return (
    <div className='px-4 py-6 sm:px-0'>
      <div className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-2 hover:shadow-xl hover:border-slate-300 transition-all duration-300'>
        <div className='px-4 py-5 sm:px-6'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md'>
              <Code2 className='h-6 w-6 text-white' />
            </div>
            <h2 className='text-3xl leading-6 font-bold text-gray-900'>Authorization Policies</h2>
          </div>

          <p className='mt-1 max-w-2xl text-lg text-gray-500'>View OPA authorization policies and rules</p>
        </div>
      </div>

      {isLoading && <div className='px-4 py-5 sm:px-6 text-gray-500'>Loading policies...</div>}

      {error && (
        <div className='px-4 py-5 sm:px-6 text-red-600'>
          Error loading policies: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {policies && policies.length === 0 && <div className='px-4 py-5 sm:px-6 text-gray-500'>No policies found</div>}

      {policies && policies.length > 0 && (
        <ul className='divide-y divide-gray-200'>
          {policies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
