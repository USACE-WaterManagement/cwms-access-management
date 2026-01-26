import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Code2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { apiService, Policy } from '../services/api.service';

import PolicyCard from '@/components/PolicyCard';
import PolicyList from '@/components/PolicyList';

export default function PoliciesPage() {

  const {
    data: policies,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['policies'],
    queryFn: () => apiService.getPolicies(),
  });

  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  function handlePolicySelect(policy: Policy) {
    setSelectedPolicy(policy);
  }

  useEffect(() => {
    if (policies && policies.length > 0 && !selectedPolicy) {
      setSelectedPolicy(policies[0]);
    }
  }, [policies]);

  return (
    <div className='px-4 py-6 sm:px-0'>
      <div className='px-4 py-5 sm:px-6 mb-4'>
        <div className='flex items-center gap-3'>
          <div className='h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md'>
            <Code2
              className='h-6 w-6 text-white'
              aria-hidden='true'
            />
          </div>
          <div className='space-y-1'>
            <h2 className='text-2xl leading-6 font-bold text-gray-900'>Authorization Policies</h2>
            <p className='text-md max-w-2xl text-gray-500'>View OPA authorization policies and rules</p>
          </div>
        </div>
      </div>

      {isLoading && <div className='px-4 py-5 sm:px-6 text-gray-500'>Loading policies...</div>}

      {error && (
        <div className='px-4 py-5 sm:px-6 text-red-600'>
          Error loading policies: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {policies && policies.length === 0 && (
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <AlertCircle
            className='w-8 h-8 text-muted-foreground mb-2'
            aria-hidden='true'
          />
          <div className='px-4 py-5 sm:px-6 text-gray-500'>No policies found</div>
        </div>
      )}

      {policies && policies.length > 0 && (
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
          <div className='col-span-1'>
            <PolicyList
              policies={policies}
              selectedPolicy={selectedPolicy}
              onSelectPolicy={handlePolicySelect}
            />
          </div>
          <div className='col-span-3'>{selectedPolicy && <PolicyCard policy={selectedPolicy} />}</div>
        </div>
      )}
    </div>
  );
}
