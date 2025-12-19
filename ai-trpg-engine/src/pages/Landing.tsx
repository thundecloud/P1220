import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { listSaves, loadGame as loadGameTauri } from '../utils/tauri';

export default function Landing() {
  const navigate = useNavigate();
  const [saves, setSaves] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    loadSaves();
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadSaves = async () => {
    try {
      const savesList = await listSaves();
      setSaves(savesList);
    } catch (error) {
      console.error('Failed to load saves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewGame = () => {
    navigate('/character-creation');
  };

  const handleConfig = () => {
    navigate('/config');
  };

  const handleLoadGame = async (filename: string) => {
    try {
      const saveData = await loadGameTauri(filename);
      // TODO: Load save data into game store
      navigate('/game');
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8 grid-bg">
      <div className="max-w-5xl w-full space-y-6">
        {/* Retro System Header */}
        <div className="bg-card rounded-none p-6 border-4 border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="led"></div>
              <div className="led" style={{ animationDelay: '0.5s' }}></div>
              <div className="led" style={{ animationDelay: '1s' }}></div>
            </div>
            <div className="terminal-text font-mono text-sm">
              SYS.TIME: {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="terminal-text text-xs mb-2">[ SYSTEM ONLINE ]</div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-wider">
              SillyTavern Lesssmall
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="label">VER 0.1.0</span>
              <span className="text-muted-foreground">|</span>
              <span className="label">TRPG SIMULATION SYSTEM</span>
            </div>
            <p className="text-base text-muted-foreground mt-4 font-mono">
              &gt; 由AI驱动的动态叙事引擎
            </p>
          </div>
        </div>

        {/* Main Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Game */}
          <button
            onClick={handleNewGame}
            className="group relative bg-primary text-primary-foreground p-8 rounded-none hover:bg-opacity-90 transition-all"
          >
            <div className="absolute top-4 left-4 led"></div>
            <div className="relative z-10 text-left">
              <div className="label mb-2">[CMD_01]</div>
              <div className="text-2xl font-bold mb-2">NEW LIFE.EXE</div>
              <div className="text-sm opacity-90 font-mono">&gt; 初始化新角色数据</div>
              <div className="text-sm opacity-90 font-mono">&gt; 选择时空坐标系</div>
              <div className="text-sm opacity-90 font-mono">&gt; 开始模拟运行</div>
            </div>
            <div className="absolute bottom-4 right-4 text-4xl opacity-20">▶</div>
          </button>

          {/* Config */}
          <button
            onClick={handleConfig}
            className="group relative bg-secondary text-secondary-foreground p-8 rounded-none hover:bg-opacity-90 transition-all"
          >
            <div className="absolute top-4 left-4 led" style={{ background: 'var(--color-neon-cyan)' }}></div>
            <div className="relative z-10 text-left">
              <div className="label mb-2">[CMD_02]</div>
              <div className="text-2xl font-bold mb-2">CONFIG.SYS</div>
              <div className="text-sm opacity-90 font-mono">&gt; AI参数调节</div>
              <div className="text-sm opacity-90 font-mono">&gt; 系统选项设置</div>
              <div className="text-sm opacity-90 font-mono">&gt; 密钥配置管理</div>
            </div>
            <div className="absolute bottom-4 right-4 text-4xl opacity-20">⚙</div>
          </button>
        </div>

        {/* Saved Games Section */}
        {!loading && saves.length > 0 && (
          <div className="bg-card rounded-none p-6 border-4 border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="led" style={{ background: 'var(--color-neon-orange)' }}></div>
              <h2 className="text-2xl font-bold">SAVED_DATA.DIR</h2>
            </div>

            <div className="border-2 border-muted p-4">
              <div className="grid grid-cols-1 gap-2">
                {saves.map((save, index) => (
                  <button
                    key={save}
                    onClick={() => handleLoadGame(save)}
                    className="text-left p-4 bg-background hover:bg-muted transition-colors border-2 border-border rounded-none flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4 font-mono">
                      <span className="terminal-text">#{String(index + 1).padStart(2, '0')}</span>
                      <span className="text-foreground">{save.replace('.json', '')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="label text-xs">READY</span>
                      <span className="terminal-text group-hover:animate-pulse">▶</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Info Footer */}
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="label">STATUS:</span>
              <span className="terminal-text indicator">● OPERATIONAL</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="label">MEM: OK</span>
              <span className="text-muted-foreground">|</span>
              <span className="label">DISK: OK</span>
              <span className="text-muted-foreground">|</span>
              <span className="label">AI: STANDBY</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs font-mono text-muted-foreground">
          <p>基于大语言模型的动态叙事TRPG | POWERED BY LLM TECHNOLOGY</p>
          <p className="mt-1">© 2025 AI人生引擎 | ALL RIGHTS RESERVED</p>
        </div>
      </div>
    </div>
  );
}
