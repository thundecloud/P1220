import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CharacterPanel from '../components/game/CharacterPanel';
import GameDialogue from '../components/game/GameDialogue';
import { generateAIResponse } from '../services/aiService';
import { loadConfig } from '../utils/tauri';
import { log } from '../services/logService';
import type { Character, Message, AppConfig, AIMessage } from '../utils/types';

export default function GameMain() {
  const navigate = useNavigate();
  const location = useLocation();
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 从导航 state 或 localStorage 加载角色
  useEffect(() => {
    log.info('GameMain页面加载', { context: 'GameMain' });

    const loadCharacter = () => {
      log.debug('开始加载角色数据...', { context: 'GameMain' });

      // 优先从 location.state 获取
      const stateCharacter = location.state?.character as Character | undefined;
      if (stateCharacter) {
        log.info(`从导航state加载角色: ${stateCharacter.name}`, { context: 'GameMain' });
        setCharacter(stateCharacter);
        localStorage.setItem('currentCharacter', JSON.stringify(stateCharacter));
        return;
      }

      // 从 localStorage 恢复
      log.debug('尝试从localStorage恢复角色...', { context: 'GameMain' });
      const savedCharacter = localStorage.getItem('currentCharacter');
      if (savedCharacter) {
        try {
          const parsed = JSON.parse(savedCharacter);
          log.info(`从localStorage恢复角色: ${parsed.name}`, { context: 'GameMain' });
          setCharacter(parsed);
        } catch (error) {
          log.error('解析保存的角色数据失败', error as Error, { context: 'GameMain' });
          setError('无法加载角色数据');
        }
      } else {
        log.warn('未找到角色数据', { context: 'GameMain' });
        setError('未找到角色数据，请先创建或选择角色');
      }
    };

    const loadAppConfig = async () => {
      log.debug('开始加载应用配置...', { context: 'GameMain' });
      try {
        const configData = await loadConfig();
        const loadedConfig = JSON.parse(configData);
        log.info(`应用配置加载成功: provider=${loadedConfig.ai?.provider || 'unknown'}`, { context: 'GameMain' });
        setConfig(loadedConfig);
      } catch (error) {
        log.error('加载应用配置失败', error as Error, { context: 'GameMain' });
        setError('无法加载配置，请先配置 AI 设置');
      }
    };

    loadCharacter();
    loadAppConfig();

    return () => {
      log.debug('GameMain页面卸载', { context: 'GameMain' });
    };
  }, [location.state]);

  // 初始化游戏（发送开场白）
  useEffect(() => {
    if (character && config && messages.length === 0) {
      log.debug('触发游戏初始化: 角色和配置已就绪', { context: 'GameMain' });
      initializeGame();
    }
  }, [character, config]);

  const initializeGame = async () => {
    if (!character || !config) {
      log.warn('游戏初始化失败: 角色或配置缺失', { context: 'GameMain' });
      return;
    }

    log.info(`开始初始化游戏: 角色=${character.name}`, { context: 'GameMain' });

    const systemMessage: Message = {
      role: 'system',
      content: '游戏初始化中...',
      timestamp: new Date().toISOString(),
    };
    setMessages([systemMessage]);

    try {
      // 构建初始提示词
      const initialPrompt = buildInitialPrompt(character);
      log.debug(`初始提示词长度: ${initialPrompt.length}字符`, { context: 'GameMain' });

      // 调用 AI 生成开场
      setIsProcessing(true);
      log.info('调用AI生成开场白...', { context: 'GameMain' });

      const aiMessages: AIMessage[] = [
        { role: 'system', content: config.game.dmPrompt },
        { role: 'system', content: initialPrompt },
        { role: 'user', content: '请开始游戏，为我描述当前的场景。' },
      ];

      const startTime = Date.now();
      const response = await generateAIResponse(config.ai, aiMessages);
      const duration = Date.now() - startTime;

      log.info(`AI开场白生成成功: ${response.content.length}字符, 耗时${duration}ms`, { context: 'GameMain' });

      const dmMessage: Message = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      };

      setMessages([dmMessage]);
      log.info('游戏初始化完成', { context: 'GameMain' });
    } catch (error) {
      log.error('游戏初始化失败', error as Error, { context: 'GameMain' });
      const errorMessage: Message = {
        role: 'system',
        content: `游戏初始化失败: ${error instanceof Error ? error.message : '未知错误'}。请检查 AI 配置。`,
        timestamp: new Date().toISOString(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const buildInitialPrompt = (char: Character): string => {
    let prompt = `# 角色信息\n`;
    prompt += `姓名: ${char.name}\n`;
    if (char.gender) prompt += `性别: ${char.gender === 'male' ? '男' : char.gender === 'female' ? '女' : '其他'}\n`;
    if (char.currentAge) prompt += `年龄: ${char.currentAge} 岁\n`;

    // 添加 COC 属性
    if (char.characterAttributes) {
      prompt += `\n## 基础属性\n`;
      const attrs = char.characterAttributes.basic;
      prompt += `力量(STR): ${attrs.strength}\n`;
      prompt += `体质(CON): ${attrs.constitution}\n`;
      prompt += `敏捷(DEX): ${attrs.dexterity}\n`;
      prompt += `智力(INT): ${attrs.intelligence}\n`;
      prompt += `教育(EDU): ${attrs.education}\n`;
      prompt += `意志(POW): ${attrs.power}\n`;
      prompt += `魅力(CHA): ${attrs.charisma}\n`;
      prompt += `幸运(LUC): ${attrs.luck}\n`;
    }

    // 添加天赋
    if (char.talents && char.talents.length > 0) {
      prompt += `\n## 天赋\n`;
      char.talents.forEach(talent => {
        prompt += `- ${talent.name}: ${talent.description}\n`;
        prompt += `  AI提示: ${talent.aiPromptFragment}\n`;
      });
    }

    // 添加叙事描述
    if (char.narrativeDescription) {
      const nd = char.narrativeDescription;
      if (nd.description) prompt += `\n## 角色描述\n${nd.description}\n`;
      if (nd.personality) prompt += `\n## 性格特征\n${nd.personality}\n`;
      if (nd.scenario) prompt += `\n## 场景设定\n${nd.scenario}\n`;
      if (nd.background) prompt += `\n## 背景故事\n${nd.background}\n`;
    }

    prompt += `\n请根据以上角色信息，开始一段TRPG冒险。`;
    return prompt;
  };

  const handleSendMessage = async (content: string) => {
    if (!character || !config || isProcessing) {
      log.warn(`消息发送被阻止: character=${!!character}, config=${!!config}, isProcessing=${isProcessing}`, { context: 'GameMain' });
      return;
    }

    log.info(`用户发送消息: ${content.length}字符`, { context: 'GameMain' });
    log.debug(`消息内容: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`, { context: 'GameMain' });

    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsProcessing(true);

    try {
      // 构建 AI 消息历史
      const aiMessages: AIMessage[] = [
        { role: 'system', content: config.game.dmPrompt },
        { role: 'system', content: buildInitialPrompt(character) },
        ...messages.map(msg => ({
          role: msg.role === 'system' ? 'user' : msg.role,
          content: msg.content,
        } as AIMessage)),
        { role: 'user', content },
      ];

      log.debug(`构建AI消息历史: ${aiMessages.length}条消息`, { context: 'GameMain' });

      // 调用 AI
      log.info('调用AI生成响应...', { context: 'GameMain' });
      const startTime = Date.now();
      const response = await generateAIResponse(config.ai, aiMessages);
      const duration = Date.now() - startTime;

      log.info(`AI响应生成成功: ${response.content.length}字符, 耗时${duration}ms`, { context: 'GameMain' });

      // 添加 AI 响应
      const aiMessage: Message = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      log.error('AI响应生成失败', error as Error, { context: 'GameMain' });
      const errorMessage: Message = {
        role: 'system',
        content: `AI 响应失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-8">
        <div className="bg-card rounded-none p-8 border-4 border-destructive max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="led" style={{ background: 'var(--color-destructive)' }}></div>
            <h2 className="text-2xl font-bold">错误</h2>
          </div>
          <p className="text-muted-foreground font-mono mb-6">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-none font-bold"
            >
              返回主菜单
            </button>
            <button
              onClick={() => navigate('/config')}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-none font-bold"
            >
              前往配置
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!character || !config) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="terminal-text text-xl font-mono animate-pulse">
          [ LOADING GAME SESSION... ]
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg p-4">
      <div className="max-w-[1920px] mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-card rounded-none p-4 border-4 border-border mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
              <div>
                <h1 className="text-2xl font-bold">GAME SESSION</h1>
                <div className="label text-xs mt-1">Active Character: {character.name}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirm('确定要退出游戏吗？未保存的进度将丢失。')) {
                    localStorage.removeItem('currentCharacter');
                    navigate('/');
                  }
                }}
                className="px-6 py-3 bg-destructive text-destructive-foreground rounded-none font-bold"
              >
                🚪 退出游戏
              </button>
              <button
                onClick={() => navigate('/config')}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-none font-bold"
              >
                ⚙️ 设置
              </button>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
          {/* Left Panel - Character Info */}
          <div className="lg:col-span-3 overflow-y-auto custom-scrollbar">
            <CharacterPanel character={character} />
          </div>

          {/* Right Panel - Game Dialogue */}
          <div className="lg:col-span-9 flex flex-col">
            <div className="flex-1 min-h-0">
              <GameDialogue
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
