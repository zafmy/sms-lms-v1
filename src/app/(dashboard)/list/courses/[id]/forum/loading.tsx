const Loading = () => {
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-6 w-64 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border rounded-md p-4">
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="flex gap-4">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Loading;
