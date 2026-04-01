export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <div className="text-xl font-semibold text-gray-700 mb-2">
            Setting up your account
          </div>
          <div className="text-sm text-gray-500">
            Please wait while we prepare everything...
          </div>
        </div>
        
        {/* Form Skeleton */}
        <div className="mt-10 space-y-6">
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
      </div>
    </div>
  );
}