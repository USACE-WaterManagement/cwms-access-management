import { useQuery } from '@tanstack/react-query';

import { apiService } from '../services/api.service';

export default function RolesPage() {
  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiService.getRoles(),
  });

  return (
    <div className='px-4 py-6 sm:px-0'>
      <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
        <div className='px-4 py-5 sm:px-6'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>Roles</h3>
          <p className='mt-1 max-w-2xl text-sm text-gray-500'>View all roles and their associated permissions</p>
        </div>
        <div className='border-t border-gray-200'>
          {isLoading && (
            <div className='px-4 py-5 sm:px-6 text-gray-500'>Loading roles...</div>
          )}
          {error && (
            <div className='px-4 py-5 sm:px-6 text-red-600'>
              Error loading roles: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          )}
          {roles && roles.length === 0 && (
            <div className='px-4 py-5 sm:px-6 text-gray-500'>No roles found</div>
          )}
          {roles && roles.length > 0 && (
            <ul className='divide-y divide-gray-200'>
              {roles.map((role) => (
                <li key={role.id} className='px-4 py-5 sm:px-6'>
                  <div>
                    <p className='text-sm font-medium text-indigo-600'>{role.name}</p>
                    {role.description && (
                      <p className='mt-1 text-sm text-gray-500'>{role.description}</p>
                    )}
                    <p className='mt-1 text-xs text-gray-400'>ID: {role.id}</p>
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
