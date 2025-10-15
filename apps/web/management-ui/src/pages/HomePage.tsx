export default function HomePage() {
  return (
    <div className='px-4 py-6 sm:px-0'>
      <div className='p-8'>
        <h2 className='text-2xl font-bold text-gray-900 mb-4'>Welcome to CWMS Access Management</h2>
        <p className='text-gray-600 mb-4'>
          This is a read-only interface for viewing and managing CWMS authorization policies, users, and roles.
        </p>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-8'>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Users</h3>
            <p className='text-gray-600 text-sm'>View user accounts and their assigned roles</p>
          </div>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Roles</h3>
            <p className='text-gray-600 text-sm'>View role definitions and permissions</p>
          </div>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Policies</h3>
            <p className='text-gray-600 text-sm'>View OPA authorization policies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
