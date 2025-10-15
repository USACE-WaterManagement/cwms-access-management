import { useQuery } from '@tanstack/react-query';

import { apiService } from '../services/api.service';

export default function PoliciesPage() {
  const { data: policies, isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: () => apiService.getPolicies(),
  });

  return (
    <div className='px-4 py-6 sm:px-0'>
      <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
        <div className='px-4 py-5 sm:px-6'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>Authorization Policies</h3>
          <p className='mt-1 max-w-2xl text-sm text-gray-500'>View OPA authorization policies and rules</p>
        </div>
        <div className='border-t border-gray-200'>
          {isLoading && (
            <div className='px-4 py-5 sm:px-6 text-gray-500'>Loading policies...</div>
          )}
          {error && (
            <div className='px-4 py-5 sm:px-6 text-red-600'>
              Error loading policies: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          )}
          {policies && policies.length === 0 && (
            <div className='px-4 py-5 sm:px-6 text-gray-500'>No policies found</div>
          )}
          {policies && policies.length > 0 && (
            <ul className='divide-y divide-gray-200'>
              {policies.map((policy) => (
                <li key={policy.id} className='px-4 py-5 sm:px-6'>
                  <div>
                    <p className='text-sm font-medium text-indigo-600'>{policy.name}</p>
                    <p className='mt-1 text-sm text-gray-500'>{policy.description}</p>
                    <p className='mt-1 text-xs text-gray-400'>ID: {policy.id}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
