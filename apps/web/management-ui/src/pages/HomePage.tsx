import { Link } from 'react-router-dom';
import { Code2, ShieldUser, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className='px-4 py-6 sm:px-0'>
      <div className='p-8'>
        <h2 className='text-2xl font-bold text-gray-900 mb-4'>Welcome to CWMS Access Management</h2>
        <p className='text-gray-600 mb-4'>
          This is a read-only interface for viewing and managing CWMS authorization policies, users, and roles.
        </p>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-8'>
          <Link
            to='/users'
            className='group bg-white p-6 rounded-lg shadow hover:shadow-lg hover:border-blue-200 border border-transparent transition-all duration-200 flex flex-col justify-between min-h-[160px]'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md'>
                  <Users className='w-5 h-5 text-white' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200'>Users</h3>
              </div>
              <p className='text-gray-600 text-sm'>View user accounts and their assigned roles</p>
            </div>
            <div className='flex justify-end mt-4'>
              <svg className='w-5 h-5 text-gray-600 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
              </svg>
            </div>
          </Link>
          <Link
            to='/roles'
            className='group bg-white p-6 rounded-lg shadow hover:shadow-lg hover:border-blue-200 border border-transparent transition-all duration-200 flex flex-col justify-between min-h-[160px]'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md'>
                  <ShieldUser className='w-5 h-5 text-white' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200'>Roles</h3>
              </div>
              <p className='text-gray-600 text-sm'>View role definitions and permissions</p>
            </div>
            <div className='flex justify-end mt-4'>
              <svg className='w-5 h-5 text-gray-600 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
              </svg>
            </div>
          </Link>
          <Link
            to='/policies'
            className='group bg-white p-6 rounded-lg shadow hover:shadow-lg hover:border-blue-200 border border-transparent transition-all duration-200 flex flex-col justify-between min-h-[160px]'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md'>
                  <Code2  className='w-5 h-5 text-white' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200'>Policies</h3>
              </div>
              <p className='text-gray-600 text-sm'>View OPA authorization policies</p>
            </div>
            <div className='flex justify-end mt-4'>
              <svg className='w-5 h-5 text-gray-600 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
