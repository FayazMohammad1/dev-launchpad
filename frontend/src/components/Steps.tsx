import { Check, Loader2 } from 'lucide-react';
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

interface StepItem {
  id: number;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
}

function Steps({ prompt, files, uiPrompts, chat, messages = [], onSendMessage, sending = false, error }: StepsProps) {
  const [messageInput, setMessageInput] = useState('');

  // Parse each model response to extract intro, plan, and key features
  const parsedConversation = useMemo(() => {
    const parsed: Array<{
      role: 'user' | 'model';
      content: string;
      intro?: string;
      plan?: StepItem[];
      keyFeatures?: string[];
      planCompleted?: boolean;
    }> = [];

    // Include initial prompt as first user message if not in messages
    const allMessages = [...messages];
    if (allMessages.length === 0 && prompt) {
      allMessages.unshift({ role: 'user', content: prompt });
      if (chat?.response || chat?.text) {
        allMessages.push({ role: 'model', content: chat.response || chat.text });
      }
    }

    // Filter out template prompts (they contain boltAction/boltArtifact tags or system guidelines)
    const isTemplatePrompt = (content: string) => {
      return (
        content.includes('<boltAction') || 
        content.includes('<boltArtifact') || 
        content.includes('Return all these files') ||
        content.includes('For all designs I ask you to make') ||
        content.includes('By default, this template supports') ||
        content.includes('Make webpages that are fully featured and worthy for production')
      );
    };

    allMessages.forEach((msg, idx) => {
      if (msg.role === 'user') {
        // Skip template prompts, only show actual user messages
        if (!isTemplatePrompt(msg.content || '')) {
          parsed.push({
            role: 'user',
            content: msg.content?.trim() || '',
          });
        }
      } else if (msg.role === 'model') {
        const rawText = msg.content || '';
        
        // Extract intro (text before <plan> tag)
        const planMatch = rawText.match(/<plan>([\s\S]*?)<\/plan>/i);
        let intro = rawText;
        
        if (planMatch) {
          intro = rawText.substring(0, rawText.indexOf('<plan>')).trim();
        }
        
        // Remove all tags from intro
        intro = intro
          .replace(/<boltAction[^>]*>[\s\S]*?<\/boltAction>/gi, '')
          .replace(/<boltArtifact[^>]*>[\s\S]*?<\/boltArtifact>/gi, '')
          .replace(/<plan>[\s\S]*?<\/plan>/gi, '')
          .replace(/<keyFeatures>[\s\S]*?<\/keyFeatures>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();

        if (!intro) {
          intro = files && Object.keys(files).length > 0 
            ? 'Generated project files and setup.' 
            : 'Preparing your project...';
        }

        // Parse plan steps
        const steps: StepItem[] = [];
        if (planMatch) {
          const planContent = planMatch[1];
          const stepMatches = planContent.matchAll(/<step\s+status="([^"]*)"[^>]*>(.*?)<\/step>/gi);
          
          let id = 1;
          for (const match of stepMatches) {
            const title = match[2].trim();
            if (title) {
              // All steps from LLM - mark as completed if we have files (plan is executed)
              const hasFiles = !!files && Object.keys(files).length > 0;
              let status: 'completed' | 'in-progress' | 'pending' = 'pending';
              
              if (hasFiles) {
                // Mark ALL steps as completed since files have been generated
                status = 'completed';
              }
              
              steps.push({ id, title, status });
              id++;
            }
          }
        }

        // Fallback: if no plan found, show a simple progress indicator
        if (steps.length === 0) {
          const hasFiles = !!files && Object.keys(files).length > 0;
          steps.push({
            id: 1,
            title: 'Analyzing your request and setting up project',
            status: hasFiles ? 'completed' : 'in-progress'
          });
          if (hasFiles) {
            steps.push({
              id: 2,
              title: `Generated ${Object.keys(files).length} project files`,
              status: 'completed'
            });
          }
        }

        // Extract key features
        const featuresMatch = rawText.match(/<keyFeatures>([\s\S]*?)<\/keyFeatures>/i);
        const keyFeatures: string[] = [];
        if (featuresMatch) {
          const featuresContent = featuresMatch[1];
          const featureMatches = featuresContent.matchAll(/<feature>(.*?)<\/feature>/gi);
          for (const match of featureMatches) {
            const feature = match[1].trim();
            if (feature) keyFeatures.push(feature);
          }
        }

        const planCompleted = steps.every(s => s.status === 'completed');

        parsed.push({
          role: 'model',
          content: rawText,
          intro,
          plan: steps,
          keyFeatures: keyFeatures.length > 0 ? keyFeatures : undefined,
          planCompleted,
        });
      }
    });

    return parsed;
  }, [messages, chat, files, prompt]);

  const handleSend = async () => {
    if (!onSendMessage) return;
    const text = messageInput.trim();
    if (!text || sending) return;
    const ok = await onSendMessage(text);
    if (ok) {
      setMessageInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {parsedConversation.map((item, idx) => (
          <div key={idx}>
            {item.role === 'user' ? (
              <div className="bg-[#1a1f26] border border-[#2b323d] rounded p-3">
                <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">You</div>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{item.content}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* LLM Intro Response */}
                <div className="space-y-1">
                  <p className="text-sm text-gray-300 leading-relaxed">{item.intro}</p>
                </div>

                {/* Plan Section */}
                {item.plan && item.plan.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold text-sm">Plan</h3>
                    <div className="space-y-2 pl-3">
                      {item.plan.map((step) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${
                              step.status === 'completed'
                                ? 'bg-green-600'
                                : step.status === 'in-progress'
                                ? 'bg-blue-600'
                                : 'bg-transparent border border-[#30363d]'
                            }`}
                          >
                            {step.status === 'completed' ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : step.status === 'in-progress' ? (
                              <Loader2 className="w-3 h-3 text-white animate-spin" />
                            ) : (
                              <span className="text-gray-500 text-[9px]">○</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={`text-xs ${step.status === 'pending' ? 'text-gray-500' : 'text-gray-200'}`}>
                              {step.title}
                            </div>
                          </div>
                        </div>
                      ))}
                      {item.planCompleted && (
                        <div className="flex items-center gap-2 text-green-400 text-xs mt-2">
                          <Check className="w-3 h-3" />
                          Plan completed
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Features */}
                {item.keyFeatures && item.keyFeatures.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold text-sm">Key Features</h3>
                    <ul className="list-disc list-inside space-y-1 pl-3">
                      {item.keyFeatures.map((feature, fIdx) => (
                        <li key={fIdx} className="text-xs text-gray-300">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Summary */}
                {files && Object.keys(files).length > 0 && idx === parsedConversation.length - 1 && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-xs text-green-300">
                      ✓ Successfully generated {Object.keys(files).length} files!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Follow-up input at bottom */}
      <div className="border-t border-[#30363d] p-4 space-y-2">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up or request changes... (Enter to send, Shift+Enter for new line)"
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
  );
}

export default Steps;
