import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UsersIcon } from 'lucide-react';

import { apiService } from '../services/api.service';
import { Input } from '../components/ui/input';
import { CopyableId } from '../components/CopyableId';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(),
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;

    const search = searchTerm.toLowerCase();

    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.firstName?.toLowerCase().includes(search) ||
        user.lastName?.toLowerCase().includes(search),
    );
  }, [users, searchTerm]);

  return (
    <div className='px-4 py-6 sm:px-0'>
      <div className='px-2 py-5 mb-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md'>
              <UsersIcon
                className='h-6 w-6 text-white'
                aria-hidden='true'
              />
            </div>
            <div>
              <h2 className='text-2xl leading-6 font-bold text-gray-900'>Users</h2>
              <p className='mt-1 text-md text-gray-600'>Manage and view all system users and their permissions</p>
            </div>
          </div>

          <div className='flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg'>
            <svg
              className='w-5 h-5'
              fill='currentColor'
              viewBox='0 0 20 20'>
              <path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
            </svg>
            <span className='font-semibold'>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
            </span>
          </div>
        </div>
      </div>
      <div className='bg-white shadow-lg rounded-xl border border-gray-300'>
        <div className='px-6 py-5 rounded-xl rounded-b-none border-b border-b-gray-300 bg-gray-50'>
          <div className='mt-4'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <svg
                  className='h-5 w-5 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </div>
              <Input
                type='text'
                placeholder='Search users by name, username, or email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

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
                <span className='text-lg font-medium'>Loading users...</span>
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
                  <p className='text-lg font-semibold text-red-600'>Error loading users</p>
                  <p className='text-sm text-gray-600 mt-1'>
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {users && filteredUsers.length === 0 && !isLoading && (
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
                  <p className='text-lg font-semibold text-gray-600'>No users found</p>
                  <p className='text-sm text-gray-500 mt-1'>
                    {searchTerm
                      ? 'Try adjusting your search criteria'
                      : 'No users are currently registered in the system'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    User
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Email
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Full Name
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Status
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    User ID
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className='hover:bg-blue-50 transition-colors duration-150'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center'>
                          <span className='text-white font-semibold text-sm'>
                            {user.username.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className='ml-4'>
                          <div className='text-sm font-semibold text-gray-900'>{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-600'>{user.email || '-'}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-600'>
                        {user.firstName || user.lastName
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : '-'}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          user.enabled
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${user.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {user.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <CopyableId id={user.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredUsers.length > 0 && (
          <div className='px-6 py-4 bg-gray-50 rounded-xl rounded-t-none border-t border-gray-300'>
            <div className='flex items-center justify-between text-sm text-gray-600'>
              <p>
                Showing <span className='font-semibold text-gray-900'>{filteredUsers.length}</span> of{' '}
                <span className='font-semibold text-gray-900'>{users?.length || 0}</span> users
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className='text-blue-600 hover:text-blue-700 font-medium'>
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
