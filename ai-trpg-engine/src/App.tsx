import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Config from './pages/Config';
import CharacterCreation from './pages/CharacterCreation';
import CharacterManagement from './pages/CharacterManagement';
import GameMain from './pages/GameMain';
import LorebookManagement from './pages/LorebookManagement';
import LogViewer from './pages/LogViewer';

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
          <Route path="/logs" element={<LogViewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
