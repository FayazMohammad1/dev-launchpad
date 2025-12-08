import LandingPage from './pages/LandingPage';
import Workspace from './pages/Workspace';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/builder' element={<Workspace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
