import { Check, Loader2, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

type ConversationMessage = {
  role: 'user' | 'model';
  content: string;
};

interface StepsProps {
  prompt: string;
  files?: Record<string, string> | null;
  uiPrompts?: string[];
  chat?: any;
  messages?: ConversationMessage[];
  onSendMessage?: (message: string) => Promise<boolean>;
  sending?: boolean;
  error?: string | null;
}

interface Step {
  id: number;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
  description?: string;
}

// TODO: needs to improve this for better understanding of user what had happened & remove fixed mock steps
function Steps({ prompt, files, uiPrompts, chat, messages = [], onSendMessage, sending = false, error }: StepsProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
  const [messageInput, setMessageInput] = useState('');

  const formattedMessages = useMemo(() => {
    const stripTags = (text: string) => text
      .replace(/<boltAction[^>]*>[\s\S]*?<\/boltAction>/gi, '')
      .replace(/<boltArtifact[^>]*>|<\/boltArtifact>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    return messages.map((m) => {
      if (m.role === 'model') {
        const cleaned = stripTags(m.content || '');
        const concise = cleaned.length > 600 ? cleaned.slice(0, 600) + '…' : cleaned;
        return { ...m, content: concise || 'Model responded with changes.' };
      }
      return m;
    });
  }, [messages]);

  const toggleStep = (id: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSteps(newExpanded);
  };

  // Generate dynamic steps from uiPrompts and chat response
  const generateSteps = (): Step[] => {
    const generatedSteps: Step[] = [];
    let stepId = 1;

    // Step 1: Analyzing requirements
    generatedSteps.push({
      id: stepId++,
      title: 'Analyzing requirements',
      status: 'completed',
      description: `Processing your request: "${prompt}"`,
    });

    // Step 2: Setting up project structure
    if (uiPrompts && uiPrompts.length > 0) {
      generatedSteps.push({
        id: stepId++,
        title: 'Setting up project structure',
        status: 'completed',
        description: 'Creating folders and initial project files',
      });
    }

    // Extract actions from chat response (files, folders, commands)
    if (chat && chat.response) {
      const chatText = chat.response;
      
      // Look for file creation actions
      const hasFileActions = chatText.includes('boltAction');
      if (hasFileActions && files && Object.keys(files).length > 0) {
        generatedSteps.push({
          id: stepId++,
          title: `Generating ${Object.keys(files).length} files`,
          status: 'completed',
          description: `Created ${Object.keys(files).length} project files`,
        });
      }

      // Look for component generation mentions
      if (chatText.toLowerCase().includes('component')) {
        generatedSteps.push({
          id: stepId++,
          title: 'Building components',
          status: 'completed',
          description: 'Creating React components with full functionality',
        });
      }

      // Look for database/schema mentions
      if (chatText.toLowerCase().includes('database') || chatText.toLowerCase().includes('schema')) {
        generatedSteps.push({
          id: stepId++,
          title: 'Creating database schema',
          status: 'completed',
          description: 'Setting up database structure and models',
        });
      }

      // Look for feature/implementation mentions
      if (chatText.toLowerCase().includes('feature') || chatText.toLowerCase().includes('implement')) {
        generatedSteps.push({
          id: stepId++,
          title: 'Implementing features',
          status: 'completed',
          description: 'Adding core functionality and business logic',
        });
      }
    }

    // Add final steps
    generatedSteps.push({
      id: stepId++,
      title: 'Testing & optimization',
      status: 'completed',
      description: 'Ensuring code quality and performance',
    });

    // If no files yet, mark last step as in-progress for demo
    if (!files || Object.keys(files).length === 0) {
      const lastStep = generatedSteps[generatedSteps.length - 1];
      lastStep.status = 'in-progress';
    }

    return generatedSteps;
  };

  const steps = generateSteps();

  // Generate summary text based on what was created
  const generateSummary = () => {
    if (!files || Object.keys(files).length === 0) {
      return "Building your application...";
    }

    const fileCount = Object.keys(files).length;
    let summary = `I've successfully generated your application with ${fileCount} files! `;
    
    if (chat && chat.response) {
      return summary;
    }
    
    return summary;
  };

  const handleSend = async () => {
    if (!onSendMessage) return;
    const text = messageInput.trim();
    if (!text || sending) return;
    const ok = await onSendMessage(text);
    if (ok) {
      setMessageInput('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#30363d]">
        <h2 className="text-white font-semibold mb-2">Build Steps</h2>
        <p className="text-sm text-gray-400 line-clamp-2">{prompt}</p>
        {files && (
          <p className="text-xs text-gray-500 mt-2">
            Generated files: {Object.keys(files).length}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id}>
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full flex gap-3 hover:bg-[#161b22] p-2 rounded transition-colors"
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'completed'
                        ? 'bg-green-600'
                        : step.status === 'in-progress'
                        ? 'bg-blue-600'
                        : 'bg-[#21262d] border border-[#30363d]'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : step.status === 'in-progress' ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <span className="text-gray-500 text-sm">{step.id}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-0.5 h-12 ${
                        step.status === 'completed' ? 'bg-green-600' : 'bg-[#30363d]'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3
                    className={`font-medium flex items-center gap-2 ${
                      step.status === 'pending' ? 'text-gray-500' : 'text-white'
                    }`}
                  >
                    {step.title}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedSteps.has(step.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </h3>
                  {step.status === 'in-progress' && (
                    <p className="text-xs text-gray-400 mt-1">Processing...</p>
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {expandedSteps.has(step.id) && (
                <div className="ml-11 mt-2 mb-3 text-xs text-gray-400 space-y-1">
                  {step.description && (
                    <p className="text-gray-300">{step.description}</p>
                  )}
                  {step.id === steps.find(s => s.status === 'completed' && Object.keys(files || {}).length > 0)?.id && files && (
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <div className="font-medium text-white text-xs mb-1">Generated files</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {Object.keys(files).slice(0, 10).map((f) => (
                          <li key={f} className="truncate text-gray-400">{f}</li>
                        ))}
                        {Object.keys(files).length > 10 && (
                          <li className="text-gray-500">
                            +{Object.keys(files).length - 10} more files
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary section */}
        {files && Object.keys(files).length > 0 && (
          <div className="mt-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-300">
              ✓ {generateSummary()}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3 border-t border-[#30363d] pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Follow-up</h3>
            {sending && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-3 pr-1 bg-[#0f1319] border border-[#30363d] rounded p-3">
            {formattedMessages.length === 0 && (
              <p className="text-xs text-gray-500">Ask a follow-up to refine the app.</p>
            )}

            {formattedMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] space-y-1 rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm border ${
                    m.role === 'user'
                      ? 'bg-blue-600/20 border-blue-600/40 text-blue-100'
                      : 'bg-[#151a21] border-[#2b323d] text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide">
                    <span className={m.role === 'user' ? 'text-blue-200' : 'text-purple-200'}>
                      {m.role === 'user' ? 'You' : 'AI'}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="space-y-2">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Describe a change or ask a follow-up..."
              className="w-full bg-[#0f1319] border border-[#30363d] rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSend}
                disabled={!messageInput.trim() || sending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Steps;
