'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('App Route Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-4xl mb-4">🚴‍♂️💥</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            App Error
          </h1>
          <p className="text-gray-600 mb-6">
            Something went wrong with the app. This might be a temporary issue with weather data or your settings.
          </p>
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/app/settings'}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
            >
              Check Settings
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full text-gray-500 hover:text-gray-700 font-medium"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}