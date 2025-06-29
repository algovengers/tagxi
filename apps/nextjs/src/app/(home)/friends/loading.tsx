export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {/* Larger, more visible spinner */}
      <div className="relative h-16 w-16">
        <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-6 text-lg text-gray-700 font-medium">
        Loading friends...
      </p>
    </div>
  );
}
