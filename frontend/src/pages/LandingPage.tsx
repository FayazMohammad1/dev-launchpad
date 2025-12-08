import { useState } from 'react';
import { Sparkles, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATE_URL, CHAT_URL } from '../lib/config';
import parseBoltArtifact from '../lib/boltParser';
import fileContents from '../lib/fileContents';

function LandingPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(TEMPLATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Template generation failed');
        setLoading(false);
        return;
      }

      // Assemble messages for /chat: include all template prompts then the user prompt
      const messages: Array<{ role: string; content: string }> = [];
      if (Array.isArray(data?.prompts)) {
        data.prompts.forEach((p: any) => {
          messages.push({ role: 'user', content: String(p) });
        });
      }
      // user's original instruction as final message
      messages.push({ role: 'user', content: prompt });

      // Call /chat
      let chatResponseBody: any = null;
      try {
        const chatRes = await fetch(CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        });

        chatResponseBody = await chatRes.json();

        if (!chatRes.ok) {
          setError(chatResponseBody?.error || 'Chat generation failed');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setError(err?.message || 'Chat network error');
        setLoading(false);
        return;
      }

      // Parse files from chat response (expected boltArtifact)
      const responseText = chatResponseBody?.response || chatResponseBody?.text || '';
      const files = parseBoltArtifact(responseText);

      // Populate runtime fileContents so FileExplorer / Download use real files
      Object.keys(files).forEach((path) => {
        (fileContents as any)[path] = files[path];
      });

      // Navigate to builder and pass prompt + template + chat
      navigate('/builder', { state: { prompt, template: data, chat: chatResponseBody, files } });
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
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
            <div className="flex items-center gap-3 mr-4">
              {error && <div className="text-red-400 text-sm">{error}</div>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {loading ? 'Generating...' : 'Generate'}
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
            <p className="text-gray-400 text-sm">Advanced AI generates production-ready code</p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-white font-medium">Real-time</h3>
            </div>
            <p className="text-gray-400 text-sm">Watch your application build in real-time</p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-white font-medium">Production Ready</h3>
            </div>
            <p className="text-gray-400 text-sm">Clean, maintainable code ready to deploy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
