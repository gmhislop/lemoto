export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <div className="text-2xl font-bold text-blue-600 mb-2">🚴‍♂️</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading</h2>
        <p className="text-gray-500">Getting your ride data ready...</p>
      </div>
    </div>
  );
}