import { useState } from 'react';
import { Sparkles, Zap, Check } from 'lucide-react';

interface LandingPageProps {
  onGenerate: (prompt: string) => void;
}

function LandingPage({ onGenerate }: LandingPageProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Zap className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Build Your App with AI
          </h1>
          <p className="text-xl text-gray-400">
            Describe your application and watch it come to life
          </p>
        </div>

        <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-6 mb-8">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the app you want to build..."
            className="w-full bg-[#0d1117] text-white border border-[#30363d] rounded-lg p-4 min-h-[150px] resize-none focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500"
          />

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-white font-medium">AI-Powered</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Advanced AI generates production-ready code
            </p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-white font-medium">Real-time</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Watch your application build in real-time
            </p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-white font-medium">Production Ready</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Clean, maintainable code ready to deploy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
