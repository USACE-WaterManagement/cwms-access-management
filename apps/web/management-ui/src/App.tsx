import { Link, Route, Routes, Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import UsersPage from '@/pages/UsersPage';
import RolesPage from '@/pages/RolesPage';
import PoliciesPage from '@/pages/PoliciesPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <svg className='animate-spin h-12 w-12 text-blue-600 mx-auto mb-4' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
          </svg>
          <p className='text-gray-600 font-medium'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, logout, username } = useAuth();

  return (
    <div className='min-h-screen bg-gray-50'>
      {isAuthenticated && (
        <nav className='bg-white shadow-md border-b border-gray-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between h-16'>
              <div className='flex items-center'>
                <div className='flex-shrink-0 flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md'>
                    <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                    </svg>
                  </div>
                  <h1 className='text-xl font-bold text-gray-900'>CWMS Access Management</h1>
                </div>
                <div className='hidden sm:ml-8 sm:flex sm:space-x-2'>
                  <Link
                    to='/'
                    className='text-gray-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200'>
                    Home
                  </Link>
                  <Link
                    to='/users'
                    className='text-gray-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200'>
                    Users
                  </Link>
                  <Link
                    to='/roles'
                    className='text-gray-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200'>
                    Roles
                  </Link>
                  <Link
                    to='/policies'
                    className='text-gray-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200'>
                    Policies
                  </Link>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 border border-gray-200 hover:border-gray-300 cursor-default'>
                  <svg
                    className='w-5 h-5 text-gray-600'
                    fill='currentColor'
                    viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-sm font-semibold text-gray-700'>{username}</span>
                </div>
                <button
                  onClick={logout}
                  className='flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold transition-colors duration-200 border border-red-200'>
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <Routes>
          <Route path='/login' element={<LoginPage />} />
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/users'
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/roles'
            element={
              <ProtectedRoute>
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/policies'
            element={
              <ProtectedRoute>
                <PoliciesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
