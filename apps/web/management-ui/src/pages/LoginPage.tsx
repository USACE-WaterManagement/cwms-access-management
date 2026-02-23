import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4'>
            <svg
              className='w-10 h-10 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>CWMS Access Management</h1>
        </div>

        <Card className='shadow-xl border-gray-200'>
          <CardContent className='pt-6'>
            <form
              onSubmit={handleSubmit}
              className='space-y-5'>
              <div className='space-y-2'>
                <Label
                  htmlFor='username'
                  className='text-sm font-semibold text-gray-700'>
                  Username
                </Label>
                <Input
                  id='username'
                  name='username'
                  type='text'
                  autoComplete='username'
                  required
                  placeholder='Enter your username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className='h-11 px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='password'
                  className='text-sm font-semibold text-gray-700'>
                  Password
                </Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  placeholder='Enter your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className='h-11 px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                />
              </div>

              {error && (
                <div className='rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-3'>
                  <svg
                    className='w-5 h-5 text-red-500 mt-0.5 flex-shrink-0'
                    fill='currentColor'
                    viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type='submit'
                disabled={loading}
                className='w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200'>
                {loading ? (
                  <span className='flex items-center gap-2'>
                    <svg
                      className='animate-spin h-5 w-5'
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
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 text-center'>
                <p className='text-sm text-blue-800 font-medium'>Default Credentials</p>
                <p className='text-sm text-blue-600 mt-1'>
                  Username: <span className='font-mono font-semibold'>admin</span>
                </p>
                <p className='text-sm text-blue-600'>
                  Password: <span className='font-mono font-semibold'>admin</span>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className='text-center text-sm text-gray-500 mt-6'>Powered by CWMS Authorization System</p>
      </div>
    </div>
  );
}
