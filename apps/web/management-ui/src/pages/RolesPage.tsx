import { useQuery } from '@tanstack/react-query';
import { ShieldUserIcon } from 'lucide-react';

import { apiService } from '../services/api.service';

export default function RolesPage() {
  const {
    data: roles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiService.getRoles(),
  });

  return (
    <div className='px-4 py-6 sm:px-0'>
      <div className='px-2 py-5'>
        <div className='flex items-center gap-3'>
          <div className='h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md'>
            <ShieldUserIcon
              className='h-6 w-6 text-white'
              aria-hidden='true'
            />
          </div>
          <div>
            <h2 className='text-2xl leading-6 font-bold text-gray-900'>Roles</h2>
            <p className='mt-1 max-w-2xl text-md text-gray-600'>View all roles and their associated permissions</p>
          </div>
        </div>
      </div>

      <div className='bg-white shadow-lg rounded-lg border border-gray-200'>
        <div className='overflow-x-auto'>
          {isLoading && (
            <div className='px-6 py-12 text-center'>
              <div className='inline-flex items-center gap-3 text-gray-600'>
                <svg
                  className='animate-spin h-6 w-6 text-blue-600'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
                <span className='text-lg font-medium'>Loading roles...</span>
              </div>
            </div>
          )}

          {error && (
            <div className='px-6 py-12 text-center'>
              <div className='inline-flex flex-col items-center gap-3'>
                <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-red-600'
                    fill='currentColor'
                    viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='text-lg font-semibold text-red-600'>Error loading roles</p>
                  <p className='text-sm text-gray-600 mt-1'>
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {roles && roles.length === 0 && !isLoading && (
            <div className='px-6 py-12 text-center'>
              <div className='inline-flex flex-col items-center gap-3'>
                <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                    />
                  </svg>
                </div>
                <div>
                  <p className='text-lg font-semibold text-gray-600'>No roles found</p>
                  <p className='text-sm text-gray-500 mt-1'>No roles are currently configured in the system</p>
                </div>
              </div>
            </div>
          )}

          {roles && roles.length > 0 && (
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Role
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Description
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Role ID
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className='hover:bg-blue-50 transition-colors duration-150'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-semibold text-gray-900'>{role.name}</div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-600'>{role.description || '-'}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-xs font-mono text-gray-400'>{role.id.substring(0, 8)}...</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {roles && roles.length > 0 && (
          <div className='px-6 py-4 bg-gray-50 border-t border-gray-200'>
            <div className='flex items-center justify-between text-sm text-gray-600'>
              <p>
                Showing <span className='font-semibold text-gray-900'>{roles.length}</span> of{' '}
                <span className='font-semibold text-gray-900'>{roles.length}</span> roles
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
