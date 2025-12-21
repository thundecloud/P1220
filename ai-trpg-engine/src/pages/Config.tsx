import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { loadConfig as loadConfigTauri, saveConfig as saveConfigTauri } from '../utils/tauri';
import type { AppConfig, AIProvider } from '../utils/types';
import { MODEL_PRESETS as AI_MODEL_PRESETS, testAIConfig } from '../services/aiService';

// 扁平化的模型预设列表（用于选择器）
interface FlatModelPreset {
  id: string;
  name: string;
  provider: AIProvider;
  apiBaseUrl: string;
  modelName: string;
}

// 将 AI 服务的预设转换为扁平列表
const MODEL_PRESETS: FlatModelPreset[] = [
  // Gemini 预设
  ...AI_MODEL_PRESETS.gemini.map((preset, idx) => ({
    id: `gemini-${idx}`,
    name: `Gemini - ${preset.name}`,
    provider: 'gemini' as AIProvider,
    apiBaseUrl: '',
    modelName: preset.model,
  })),
  // OpenAI 预设
  ...AI_MODEL_PRESETS.openai.map((preset, idx) => ({
    id: `openai-${idx}`,
    name: `OpenAI - ${preset.name}`,
    provider: 'openai' as AIProvider,
    apiBaseUrl: 'https://api.openai.com/v1',
    modelName: preset.model,
  })),
  // Anthropic 预设
  ...AI_MODEL_PRESETS.anthropic.map((preset, idx) => ({
    id: `anthropic-${idx}`,
    name: `Anthropic - ${preset.name}`,
    provider: 'anthropic' as AIProvider,
    apiBaseUrl: 'https://api.anthropic.com/v1',
    modelName: preset.model,
  })),
  // 自定义
  {
    id: 'custom',
    name: '自定义端点 (Custom)',
    provider: 'custom' as AIProvider,
    apiBaseUrl: '',
    modelName: '',
  },
];

// 默认DM提示词
const DEFAULT_DM_PROMPT = `你是一位经验丰富的桌面角色扮演游戏(TRPG)的游戏主持人(Dungeon Master)。

你的职责是：
1. 根据角色的世界线背景、属性、天赋，创造沉浸式的叙事体验
2. 描述场景时要生动、具体，调动玩家的感官体验
3. 尊重历史背景的真实性，同时保持故事的戏剧性
4. 根据判定结果(大成功/成功/失败/大失败)给出合理的叙事发展
5. 让玩家的选择真正影响故事走向

叙事风格：
- 使用第二人称("你")与玩家互动
- 段落简洁有力，避免冗长描写
- 在关键时刻给玩家选择的机会
- 平衡叙事节奏，有张有弛

请记住：你不是在写小说，而是在与玩家共同创造故事。`;

type TabType = 'ai' | 'game' | 'ui';

export default function Config() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ai');
  const [showDmPromptEditor, setShowDmPromptEditor] = useState(false);
  const [testingAPI, setTestingAPI] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failure' | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configData = await loadConfigTauri();
      const loadedConfig = JSON.parse(configData);

      // 确保有默认的DM提示词
      if (!loadedConfig.game.dmPrompt) {
        loadedConfig.game.dmPrompt = DEFAULT_DM_PROMPT;
      }

      setConfig(loadedConfig);
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

  // 处理模型预设切换
  const handleModelPresetChange = (presetId: string) => {
    const preset = MODEL_PRESETS.find(p => p.id === presetId);
    if (!preset || !config) return;

    const newConfig = { ...config };
    newConfig.ai.provider = preset.provider;

    // 只在非自定义模式下更新URL和模型名
    if (preset.id !== 'custom') {
      newConfig.ai.apiBaseUrl = preset.apiBaseUrl;
      newConfig.ai.modelName = preset.modelName;
    }

    setConfig(newConfig);
  };

  // 获取当前选中的预设
  const getCurrentPreset = (): string => {
    if (!config) return 'custom';

    const matchedPreset = MODEL_PRESETS.find(p =>
      p.provider === config.ai.provider &&
      (p.apiBaseUrl === config.ai.apiBaseUrl || p.apiBaseUrl === '') &&
      p.modelName === config.ai.modelName
    );

    return matchedPreset?.id || 'custom';
  };

  // 测试 API 连接
  const handleTestAPI = async () => {
    if (!config) return;

    setTestingAPI(true);
    setTestResult(null);
    setMessage('');

    try {
      const success = await testAIConfig(config.ai);
      setTestResult(success ? 'success' : 'failure');
      setMessage(success ? '✅ API 连接测试成功' : '❌ API 连接测试失败');
      setTimeout(() => {
        setMessage('');
        setTestResult(null);
      }, 5000);
    } catch (error) {
      console.error('API test error:', error);
      setTestResult('failure');
      setMessage(`❌ API 连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setTimeout(() => {
        setMessage('');
        setTestResult(null);
      }, 5000);
    } finally {
      setTestingAPI(false);
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen grid-bg">
        <div className="terminal-text text-xl font-mono animate-pulse">
          [ LOADING CONFIGURATION... ]
        </div>
      </div>
    );
  }

  const currentPreset = getCurrentPreset();
  const isCustomPreset = currentPreset === 'custom';

  return (
    <div className="min-h-screen p-8 grid-bg">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-none p-6 border-4 border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
              <div>
                <h1 className="text-4xl font-bold">CONFIG.SYS</h1>
                <div className="label mt-1">SYSTEM CONFIGURATION v2.0</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {message && (
                <span className={`terminal-text font-mono text-sm ${message.includes('失败') ? 'text-destructive' : ''}`}>
                  [ {message.toUpperCase()} ]
                </span>
              )}
              <button
                onClick={() => navigate('/character-management')}
                className="px-6 py-3 bg-accent-purple text-white rounded-none font-bold"
              >
                👤 角色管理
              </button>
              <button
                onClick={() => navigate('/lorebook')}
                className="px-6 py-3 bg-accent-teal text-black rounded-none font-bold"
              >
                📚 Lorebook 管理
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-none disabled:opacity-50"
              >
                {saving ? '保存中...' : '💾 保存配置'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-none"
              >
                ◀ 返回
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card rounded-none border-4 border-border overflow-hidden">
          <div className="flex">
            {[
              { id: 'ai' as TabType, label: 'AI 模块配置', icon: '🤖' },
              { id: 'game' as TabType, label: '游戏参数', icon: '🎲' },
              { id: 'ui' as TabType, label: '界面设置', icon: '🎨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Configuration Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* Model Preset Selection */}
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
                <h2 className="text-2xl font-bold">模型预设选择</h2>
              </div>
              <label className="label block mb-3">选择AI模型预设:</label>
              <select
                value={currentPreset}
                onChange={(e) => handleModelPresetChange(e.target.value)}
                className="w-full px-4 py-3 rounded-none font-bold"
              >
                {MODEL_PRESETS.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-3 font-mono">
                &gt; 选择预设会自动配置API端点和模型名称
              </p>
            </div>

            {/* API Configuration */}
            <div className="bg-card rounded-none p-6 border-4 border-border space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="led indicator"></div>
                  <h2 className="text-2xl font-bold">API 连接配置</h2>
                </div>
                <button
                  onClick={handleTestAPI}
                  disabled={testingAPI || !config.ai.apiKey}
                  className={`px-6 py-3 rounded-none font-bold disabled:opacity-50 ${
                    testResult === 'success' ? 'bg-terminal-green text-black' :
                    testResult === 'failure' ? 'bg-destructive text-white' :
                    'bg-accent-cyan text-black'
                  }`}
                >
                  {testingAPI ? '⏳ 测试中...' :
                   testResult === 'success' ? '✅ 连接成功' :
                   testResult === 'failure' ? '❌ 连接失败' :
                   '🔌 测试连接'}
                </button>
              </div>

              <div>
                <label className="label block mb-2">API密钥 (API KEY):</label>
                <input
                  type="password"
                  value={config.ai.apiKey}
                  onChange={(e) => updateConfig(['ai', 'apiKey'], e.target.value)}
                  placeholder={config.ai.provider === 'gemini' ? 'AIza***************************' : 'sk-********************************'}
                  className="w-full px-4 py-3 rounded-none font-mono"
                />
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  &gt; 本地加密存储 | 不会上传到任何服务器
                  {config.ai.provider === 'gemini' && (
                    <span className="block mt-1">
                      &gt; Gemini API Key 获取: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-neon-cyan underline">Google AI Studio</a>
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="label block mb-2">API端点URL{config.ai.provider === 'gemini' ? ' (可选，留空使用默认)' : ''}:</label>
                <input
                  type="text"
                  value={config.ai.apiBaseUrl || ''}
                  onChange={(e) => updateConfig(['ai', 'apiBaseUrl'], e.target.value)}
                  placeholder={
                    config.ai.provider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' :
                    'https://api.example.com/v1'
                  }
                  disabled={!isCustomPreset && config.ai.provider !== 'gemini'}
                  className="w-full px-4 py-3 rounded-none font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="label block mb-2">模型标识符:</label>
                <input
                  type="text"
                  value={config.ai.modelName}
                  onChange={(e) => updateConfig(['ai', 'modelName'], e.target.value)}
                  placeholder="gpt-4-turbo-preview"
                  disabled={!isCustomPreset}
                  className="w-full px-4 py-3 rounded-none font-mono disabled:opacity-50"
                />
              </div>
            </div>

            {/* Temperature Control - Highlighted */}
            <div className="bg-card rounded-none p-6 border-4 border-primary">
              <div className="flex items-center gap-3 mb-4">
                <div className="led" style={{ background: 'var(--color-neon-orange)' }}></div>
                <h2 className="text-2xl font-bold">创造性控制 (Temperature)</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="label">Temperature 值:</label>
                    <span className="text-2xl font-bold terminal-text font-mono">
                      {(config.ai.temperature || 0.7).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={config.ai.temperature || 0.7}
                    onChange={(e) => updateConfig(['ai', 'temperature'], parseFloat(e.target.value))}
                    className="w-full h-3 bg-muted rounded-none appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--color-terminal-green) 0%, var(--color-terminal-green) ${((config.ai.temperature || 0.7) / 2) * 100}%, var(--color-muted) ${((config.ai.temperature || 0.7) / 2) * 100}%, var(--color-muted) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
                    <span>0.0 (精确/保守)</span>
                    <span>1.0 (平衡)</span>
                    <span>2.0 (创造/随机)</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  &gt; 较低值使AI更保守和确定性；较高值使AI更有创造性和随机性
                </p>
              </div>
            </div>

            {/* Advanced Parameters */}
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="led" style={{ background: 'var(--color-neon-magenta)' }}></div>
                <h2 className="text-2xl font-bold">高级参数</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label block mb-2">Max Tokens:</label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    step="100"
                    value={config.ai.maxTokens || 2000}
                    onChange={(e) => updateConfig(['ai', 'maxTokens'], parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">最大生成长度</p>
                </div>

                <div>
                  <label className="label block mb-2">Top P:</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.ai.topP ?? 1.0}
                    onChange={(e) => updateConfig(['ai', 'topP'], parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">核采样概率</p>
                </div>

                <div>
                  <label className="label block mb-2">Presence Penalty:</label>
                  <input
                    type="number"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={config.ai.presencePenalty ?? 0}
                    onChange={(e) => updateConfig(['ai', 'presencePenalty'], parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">话题新鲜度</p>
                </div>

                <div>
                  <label className="label block mb-2">Frequency Penalty:</label>
                  <input
                    type="number"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={config.ai.frequencyPenalty ?? 0}
                    onChange={(e) => updateConfig(['ai', 'frequencyPenalty'], parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">重复惩罚</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Configuration Tab */}
        {activeTab === 'game' && (
          <div className="space-y-6">
            {/* DM Style */}
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="led" style={{ background: 'var(--color-neon-orange)' }}></div>
                <h2 className="text-2xl font-bold">DM 叙事风格</h2>
              </div>
              <label className="label block mb-3">选择游戏主持风格:</label>
              <select
                value={config.game.dmStyle}
                onChange={(e) => updateConfig(['game', 'dmStyle'], e.target.value)}
                className="w-full px-4 py-3 rounded-none font-bold"
              >
                <option value="humanistic">人文主义 - 关注人性、情感与内心世界</option>
                <option value="realistic">现实主义 - 强调历史真实性与因果逻辑</option>
                <option value="dramatic">戏剧主义 - 追求冲突张力与戏剧性转折</option>
              </select>
            </div>

            {/* DM Prompt Editor */}
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="led indicator"></div>
                  <h2 className="text-2xl font-bold">DM 系统提示词</h2>
                </div>
                <button
                  onClick={() => setShowDmPromptEditor(!showDmPromptEditor)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-none"
                >
                  {showDmPromptEditor ? '▲ 收起编辑器' : '▼ 展开编辑器'}
                </button>
              </div>

              {!showDmPromptEditor ? (
                <div className="p-4 bg-background border-2 border-border rounded-none">
                  <p className="text-sm font-mono text-muted-foreground line-clamp-3">
                    {config.game.dmPrompt || DEFAULT_DM_PROMPT}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={config.game.dmPrompt || DEFAULT_DM_PROMPT}
                    onChange={(e) => updateConfig(['game', 'dmPrompt'], e.target.value)}
                    className="w-full px-4 py-3 rounded-none font-mono text-sm min-h-[400px] resize-y"
                    placeholder="输入DM系统提示词..."
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateConfig(['game', 'dmPrompt'], DEFAULT_DM_PROMPT)}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-none"
                    >
                      恢复默认提示词
                    </button>
                    <p className="text-xs text-muted-foreground font-mono flex items-center">
                      &gt; 此提示词决定了AI如何扮演游戏主持人
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-save Settings */}
            <div className="bg-card rounded-none p-6 border-4 border-border space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
                <h2 className="text-2xl font-bold">自动保存设置</h2>
              </div>

              <div className="flex items-center gap-4 p-4 bg-background border-2 border-border rounded-none">
                <input
                  type="checkbox"
                  id="autoSave"
                  checked={config.game.autoSave}
                  onChange={(e) => updateConfig(['game', 'autoSave'], e.target.checked)}
                  className="w-6 h-6 rounded-none cursor-pointer"
                />
                <label htmlFor="autoSave" className="label cursor-pointer text-base">
                  启用自动保存协议
                </label>
              </div>

              {config.game.autoSave && (
                <div>
                  <label className="label block mb-2">自动保存间隔 (秒):</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    step="10"
                    value={config.game.autoSaveInterval}
                    onChange={(e) => updateConfig(['game', 'autoSaveInterval'], parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    &gt; 推荐值: 60-120秒
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* UI Configuration Tab */}
        {activeTab === 'ui' && (
          <div className="space-y-6">
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="led" style={{ background: 'var(--color-neon-magenta)' }}></div>
                <h2 className="text-2xl font-bold">界面设置</h2>
              </div>
              <p className="text-muted-foreground font-mono text-sm">
                &gt; UI配置功能即将推出...
              </p>
            </div>
          </div>
        )}

        {/* System Info Footer */}
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="label">CONFIG.SYS v2.0 | Cassette Futurism Edition</span>
            <span className="terminal-text flex items-center gap-2">
              <div className="led" style={{ width: '8px', height: '8px' }}></div>
              [ SYSTEM READY ]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
