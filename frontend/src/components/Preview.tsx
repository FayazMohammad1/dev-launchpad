import { RefreshCw, ExternalLink } from 'lucide-react';

// TODO: needs to work on this for complete implementation without mock preview ui
function Preview() {
  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2 flex-1">
          <button
            className="p-1.5 hover:bg-[#21262d] rounded transition-colors text-gray-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5">
            <span className="text-sm text-gray-400">http://localhost:5173/</span>
          </div>
          <button
            className="p-1.5 hover:bg-[#21262d] rounded transition-colors text-gray-400 hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white">
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-2xl w-full p-8">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your App</h1>
              <p className="text-gray-600 mb-6">
                This is a preview of your application. The actual content will be rendered here
                based on your generated code.
              </p>
              <div className="flex gap-4">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Get Started
                </button>
                <button className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                  Learn More
                </button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Feature {i}</h3>
                    <p className="text-sm text-gray-600">
                      Description of feature {i}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Preview;
