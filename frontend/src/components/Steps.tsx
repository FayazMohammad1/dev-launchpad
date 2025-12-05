import { Check, Loader2 } from 'lucide-react';

interface StepsProps {
  prompt: string;
}

interface Step {
  id: number;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
}

function Steps({ prompt }: StepsProps) {
  const steps: Step[] = [
    { id: 1, title: 'Analyzing requirements', status: 'completed' },
    { id: 2, title: 'Setting up project structure', status: 'completed' },
    { id: 3, title: 'Generating components', status: 'in-progress' },
    { id: 4, title: 'Creating database schema', status: 'pending' },
    { id: 5, title: 'Implementing features', status: 'pending' },
    { id: 6, title: 'Testing & optimization', status: 'pending' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#30363d]">
        <h2 className="text-white font-semibold mb-2">Build Steps</h2>
        <p className="text-sm text-gray-400 line-clamp-2">{prompt}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
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
              <div className="flex-1 pb-4">
                <h3
                  className={`font-medium ${
                    step.status === 'pending' ? 'text-gray-500' : 'text-white'
                  }`}
                >
                  {step.title}
                </h3>
                {step.status === 'in-progress' && (
                  <p className="text-xs text-gray-400 mt-1">Processing...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Steps;
