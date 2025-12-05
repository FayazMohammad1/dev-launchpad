import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Workspace from './components/Workspace';

function App() {
  const [prompt, setPrompt] = useState<string | null>(null);

  const handleGenerate = (userPrompt: string) => {
    setPrompt(userPrompt);
  };

  const handleBack = () => {
    setPrompt(null);
  };

  return (
    <>
      {prompt ? (
        <Workspace prompt={prompt} onBack={handleBack} />
      ) : (
        <LandingPage onGenerate={handleGenerate} />
      )}
    </>
  );
}

export default App;
