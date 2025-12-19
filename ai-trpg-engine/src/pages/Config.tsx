import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { loadConfig as loadConfigTauri, saveConfig as saveConfigTauri } from '../utils/tauri';

interface AppConfig {
  ai: {
    provider: string;
    apiKey: string;
    apiBaseUrl: string;
    modelName: string;
    temperature?: number;
    maxTokens?: number;
  };
  game: {
    dmStyle: string;
    autoSave: boolean;
    autoSaveInterval: number;
    language: string;
  };
  ui: {
    theme: string;
    fontSize: number;
    animationEnabled: boolean;
  };
}

export default function Config() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configData = await loadConfigTauri();
      setConfig(JSON.parse(configData));
    } catch (error) {
      console.error('Failed to load config:', error);
      setMessage('加载配置失败');
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    setMessage('');

    try {
      await saveConfigTauri(JSON.stringify(config, null, 2));
      setMessage('配置已保存');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path: string[], value: any) => {
    if (!config) return;

    const newConfig = { ...config };
    let current: any = newConfig;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setConfig(newConfig);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen grid-bg">
        <div className="terminal-text text-xl font-mono">
          [ LOADING CONFIGURATION... ]
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 grid-bg">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-none p-6 border-4 border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
              <h1 className="text-4xl font-bold">CONFIG.SYS</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-none"
            >
              ◀ BACK
            </button>
          </div>
          <div className="label mt-2">SYSTEM CONFIGURATION INTERFACE</div>
        </div>

        {/* AI Configuration */}
        <div className="bg-card rounded-none p-6 border-4 border-border space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="led indicator"></div>
            <h2 className="text-2xl font-bold">AI MODULE CONFIG</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label block mb-2">AI PROVIDER:</label>
              <select
                value={config.ai.provider}
                onChange={(e) => updateConfig(['ai', 'provider'], e.target.value)}
                className="w-full px-4 py-3 rounded-none"
              >
                <option value="deepseek">DEEPSEEK v3.2</option>
                <option value="openai">OPENAI GPT-4</option>
                <option value="custom">CUSTOM ENDPOINT</option>
              </select>
            </div>

            <div>
              <label className="label block mb-2">API SECRET KEY:</label>
              <input
                type="password"
                value={config.ai.apiKey}
                onChange={(e) => updateConfig(['ai', 'apiKey'], e.target.value)}
                placeholder="sk-********************************"
                className="w-full px-4 py-3 rounded-none font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                &gt; ENCRYPTED LOCAL STORAGE | NEVER TRANSMITTED
              </p>
            </div>

            <div>
              <label className="label block mb-2">API ENDPOINT URL:</label>
              <input
                type="text"
                value={config.ai.apiBaseUrl}
                onChange={(e) => updateConfig(['ai', 'apiBaseUrl'], e.target.value)}
                placeholder="https://api.deepseek.com/v1"
                className="w-full px-4 py-3 rounded-none font-mono"
              />
            </div>

            <div>
              <label className="label block mb-2">MODEL IDENTIFIER:</label>
              <input
                type="text"
                value={config.ai.modelName}
                onChange={(e) => updateConfig(['ai', 'modelName'], e.target.value)}
                placeholder="deepseek-chat"
                className="w-full px-4 py-3 rounded-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label block mb-2">TEMPERATURE [0-2]:</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.ai.temperature || 0.7}
                  onChange={(e) => updateConfig(['ai', 'temperature'], parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-none font-mono"
                />
              </div>

              <div>
                <label className="label block mb-2">MAX TOKENS:</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  step="100"
                  value={config.ai.maxTokens || 2000}
                  onChange={(e) => updateConfig(['ai', 'maxTokens'], parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Game Configuration */}
        <div className="bg-card rounded-none p-6 border-4 border-border space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="led" style={{ background: 'var(--color-neon-orange)' }}></div>
            <h2 className="text-2xl font-bold">GAME PARAMETERS</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label block mb-2">DM NARRATIVE STYLE:</label>
              <select
                value={config.game.dmStyle}
                onChange={(e) => updateConfig(['game', 'dmStyle'], e.target.value)}
                className="w-full px-4 py-3 rounded-none"
              >
                <option value="humanistic">HUMANISTIC - 人性与情感</option>
                <option value="realistic">REALISTIC - 历史真实性</option>
                <option value="dramatic">DRAMATIC - 戏剧性冲突</option>
              </select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-background border-2 border-border rounded-none">
              <input
                type="checkbox"
                id="autoSave"
                checked={config.game.autoSave}
                onChange={(e) => updateConfig(['game', 'autoSave'], e.target.checked)}
                className="w-5 h-5 rounded-none"
              />
              <label htmlFor="autoSave" className="label cursor-pointer">
                ENABLE AUTO-SAVE PROTOCOL
              </label>
            </div>

            {config.game.autoSave && (
              <div>
                <label className="label block mb-2">
                  AUTO-SAVE INTERVAL (SECONDS):
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  step="10"
                  value={config.game.autoSaveInterval}
                  onChange={(e) => updateConfig(['game', 'autoSaveInterval'], parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-none font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Save Controls */}
        <div className="bg-card rounded-none p-6 border-4 border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {message && (
                <span className={`terminal-text font-mono ${message.includes('失败') ? 'text-destructive' : ''}`}>
                  [ {message.toUpperCase()} ]
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-none disabled:opacity-50 flex items-center gap-3"
            >
              {saving ? (
                <>
                  <span className="indicator">●</span>
                  SAVING...
                </>
              ) : (
                <>
                  <span>💾</span>
                  WRITE TO DISK
                </>
              )}
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="label">CONFIG.SYS v1.0</span>
            <span className="terminal-text">[ READY ]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
