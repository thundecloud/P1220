import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Config from './pages/Config';
import CharacterCreation from './pages/CharacterCreation';
import CharacterManagement from './pages/CharacterManagement';
import GameMain from './pages/GameMain';
import LorebookManagement from './pages/LorebookManagement';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/config" element={<Config />} />
          <Route path="/character-creation" element={<CharacterCreation />} />
          <Route path="/character-management" element={<CharacterManagement />} />
          <Route path="/game" element={<GameMain />} />
          <Route path="/lorebook" element={<LorebookManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
