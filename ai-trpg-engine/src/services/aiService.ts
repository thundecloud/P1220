import type { AIConfig, AIMessage, AIResponse, AIProvider, Character, Worldline, Message } from '../utils/types';
import { lorebookService } from './lorebookService';
import { log } from './logService';

/**
 * AI 服务 - 统一的 AI 提供商接口
 * 支持 OpenAI、Gemini、Anthropic 等多种提供商
 */

// ============ 提供商特定的 API 类型 ============

/**
 * Gemini API 消息格式
 */
interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * OpenAI API 消息格式
 */
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ============ API 调用函数 ============

/**
 * 调用 Gemini API
 */
async function callGeminiAPI(
  config: AIConfig,
  messages: AIMessage[]
): Promise<AIResponse> {
  const apiKey = config.apiKey;
  const modelName = config.modelName || 'gemini-2.0-flash-exp';

  // Gemini API endpoint
  const endpoint = config.apiBaseUrl ||
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // 转换消息格式
  // Gemini 不支持 system role，需要将 system 消息转为 user 消息
  const geminiMessages: GeminiMessage[] = [];
  let systemPrompt = '';

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt += msg.content + '\n\n';
    } else {
      geminiMessages.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  // 如果有 system prompt，将其添加到第一条 user 消息前
  if (systemPrompt && geminiMessages.length > 0 && geminiMessages[0].role === 'user') {
    geminiMessages[0].parts[0].text = systemPrompt + geminiMessages[0].parts[0].text;
  }

  // 构建请求体
  const requestBody: any = {
    contents: geminiMessages,
    generationConfig: {
      temperature: config.temperature ?? 1.0,
      maxOutputTokens: config.maxTokens ?? 2048,
      topP: config.topP ?? 0.95,
    },
  };

  // 调用 API
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API 错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // 解析响应
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini API 返回了空响应');
  }

  const content = candidate.content?.parts?.[0]?.text || '';
  const finishReason = candidate.finishReason?.toLowerCase();

  // Gemini 的 usage 信息
  const usage = data.usageMetadata ? {
    promptTokens: data.usageMetadata.promptTokenCount || 0,
    completionTokens: data.usageMetadata.candidatesTokenCount || 0,
    totalTokens: data.usageMetadata.totalTokenCount || 0,
  } : undefined;

  return {
    content,
    finishReason: finishReason as AIResponse['finishReason'],
    usage,
  };
}

/**
 * 调用 OpenAI API
 */
async function callOpenAIAPI(
  config: AIConfig,
  messages: AIMessage[]
): Promise<AIResponse> {
  const endpoint = config.apiBaseUrl || 'https://api.openai.com/v1/chat/completions';

  // OpenAI 消息格式已经兼容
  const openaiMessages: OpenAIMessage[] = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  const requestBody = {
    model: config.modelName || 'gpt-3.5-turbo',
    messages: openaiMessages,
    temperature: config.temperature ?? 1.0,
    max_tokens: config.maxTokens ?? 2048,
    top_p: config.topP ?? 1.0,
    presence_penalty: config.presencePenalty ?? 0,
    frequency_penalty: config.frequencyPenalty ?? 0,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API 错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error('OpenAI API 返回了空响应');
  }

  return {
    content: choice.message?.content || '',
    finishReason: choice.finish_reason,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

/**
 * 调用 Anthropic API (Claude)
 */
async function callAnthropicAPI(
  config: AIConfig,
  messages: AIMessage[]
): Promise<AIResponse> {
  const endpoint = config.apiBaseUrl || 'https://api.anthropic.com/v1/messages';

  // Anthropic 需要分离 system 消息
  let systemPrompt = '';
  const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt += msg.content + '\n\n';
    } else {
      anthropicMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  }

  const requestBody: any = {
    model: config.modelName || 'claude-3-5-sonnet-20241022',
    messages: anthropicMessages,
    max_tokens: config.maxTokens ?? 2048,
    temperature: config.temperature ?? 1.0,
    top_p: config.topP ?? 1.0,
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt.trim();
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API 错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const content = data.content?.[0]?.text || '';

  return {
    content,
    finishReason: data.stop_reason,
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined,
  };
}

// ============ 主服务接口 ============

/**
 * 生成 AI 响应
 * @param config AI 配置
 * @param messages 消息历史
 * @returns AI 响应
 */
export async function generateAIResponse(
  config: AIConfig,
  messages: AIMessage[]
): Promise<AIResponse> {
  // 验证配置
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('API Key 未配置');
  }

  if (!config.modelName || config.modelName.trim() === '') {
    throw new Error('模型名称未配置');
  }

  // 根据提供商调用相应的 API
  switch (config.provider) {
    case 'gemini':
      return await callGeminiAPI(config, messages);

    case 'openai':
      return await callOpenAIAPI(config, messages);

    case 'anthropic':
      return await callAnthropicAPI(config, messages);

    case 'custom':
      // 自定义提供商默认使用 OpenAI 兼容格式
      return await callOpenAIAPI(config, messages);

    default:
      throw new Error(`不支持的 AI 提供商: ${config.provider}`);
  }
}

/**
 * 测试 AI 配置是否有效
 * @param config AI 配置
 * @returns 测试是否成功
 */
export async function testAIConfig(config: AIConfig): Promise<boolean> {
  try {
    const testMessages: AIMessage[] = [
      { role: 'user', content: 'Hello, please respond with "OK".' },
    ];

    const response = await generateAIResponse(config, testMessages);
    return response.content.length > 0;
  } catch (error) {
    console.error('AI 配置测试失败:', error);
    return false;
  }
}

/**
 * 获取默认配置
 */
export function getDefaultAIConfig(): AIConfig {
  return {
    provider: 'openai',
    apiKey: '',
    apiBaseUrl: 'https://api.deepseek.com/v1',  // Deepseek 兼容 OpenAI API
    modelName: 'deepseek-chat',
    temperature: 1.0,
    maxTokens: 2048,
    topP: 0.95,
  };
}

/**
 * 预设模型列表
 */
export const MODEL_PRESETS: Record<AIProvider, Array<{ name: string; model: string; baseUrl?: string }>> = {
  gemini: [
    { name: 'Gemini 2.0 Flash (推荐)', model: 'gemini-2.0-flash-exp' },
    { name: 'Gemini 1.5 Pro', model: 'gemini-1.5-pro' },
    { name: 'Gemini 1.5 Flash', model: 'gemini-1.5-flash' },
  ],
  openai: [
    { name: 'DeepSeek v3 (推荐)', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' },
    { name: 'GPT-4o', model: 'gpt-4o' },
    { name: 'GPT-4 Turbo', model: 'gpt-4-turbo' },
    { name: 'GPT-4', model: 'gpt-4' },
    { name: 'GPT-3.5 Turbo', model: 'gpt-3.5-turbo' },
  ],
  anthropic: [
    { name: 'Claude 4 Opus (推荐)', model: 'claude-opus-4-20250514' },
    { name: 'Claude 3.7 Sonnet', model: 'claude-3-7-sonnet-20250219' },
    { name: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-20241022' },
    { name: 'Claude 3 Opus', model: 'claude-3-opus-20240229' },
  ],
  custom: [],
};

// ============ 提示词管理与 Lorebook 注入 ============

/**
 * 构建角色信息提示词片段
 */
function buildCharacterPrompt(character: Character, worldline: Worldline): string {
  const parts: string[] = [];

  // 基础信息
  parts.push(`角色名称: ${character.name}`);
  parts.push(`世界线: ${worldline.name} (${worldline.era}, ${worldline.region})`);

  // 根据创建模式决定使用哪些字段
  const mode = character.creationMode || 'coc';

  if (mode === 'narrative' || mode === 'hybrid') {
    // 叙事模式：使用 narrativeDescription
    const narrative = character.narrativeDescription;
    if (narrative) {
      if (narrative.description) {
        parts.push(`\n角色描述:\n${narrative.description}`);
      }
      if (narrative.personality) {
        parts.push(`\n性格特征:\n${narrative.personality}`);
      }
      if (narrative.scenario) {
        parts.push(`\n当前情境:\n${narrative.scenario}`);
      }
      if (narrative.background) {
        parts.push(`\n背景故事:\n${narrative.background}`);
      }
    }
  }

  if (mode === 'coc' || mode === 'hybrid') {
    // COC 模式：使用属性和天赋
    if (character.characterAttributes) {
      const attrs = character.characterAttributes;
      parts.push('\n基础属性:');
      parts.push(`- 力量(STR): ${attrs.basic.strength}`);
      parts.push(`- 体质(CON): ${attrs.basic.constitution}`);
      parts.push(`- 敏捷(DEX): ${attrs.basic.dexterity}`);
      parts.push(`- 智力(INT): ${attrs.basic.intelligence}`);
      parts.push(`- 教育(EDU): ${attrs.basic.education}`);
      parts.push(`- 意志(POW): ${attrs.basic.power}`);
      parts.push(`- 魅力(CHA): ${attrs.basic.charisma}`);
      parts.push(`- 幸运(LUC): ${attrs.basic.luck}`);

      parts.push('\n派生属性:');
      parts.push(`- 生命值(HP): ${attrs.derived.hitPoints}`);
      parts.push(`- 理智值(SAN): ${attrs.derived.sanity}`);
      parts.push(`- 魔力值(MP): ${attrs.derived.magicPoints}`);

      // 技能（仅列出主要技能）
      if (attrs.skills && attrs.skills.length > 0) {
        parts.push('\n主要技能:');
        attrs.skills.slice(0, 10).forEach(skill => {
          parts.push(`- ${skill.name}: ${skill.currentValue}`);
        });
      }
    }

    // 天赋
    if (character.talents && character.talents.length > 0) {
      parts.push('\n天赋特质:');
      character.talents.forEach(talent => {
        parts.push(`- ${talent.name}: ${talent.description}`);
      });
    }
  }

  // 简历级详细信息（如果有）
  if (character.detailedProfile) {
    const profile = character.detailedProfile;

    if (profile.goals && profile.goals.length > 0) {
      parts.push(`\n目标: ${profile.goals.join(', ')}`);
    }

    if (profile.fears && profile.fears.length > 0) {
      parts.push(`\n恐惧: ${profile.fears.join(', ')}`);
    }
  }

  return parts.join('\n');
}

/**
 * 构建DM系统提示词
 */
function buildSystemPrompt(
  character: Character,
  worldline: Worldline,
  dmPrompt: string,
  activatedLorebookEntries: string[]
): string {
  const parts: string[] = [];

  // 1. DM角色提示
  parts.push(dmPrompt);

  // 2. 角色信息
  parts.push('\n===== 角色信息 =====');
  parts.push(buildCharacterPrompt(character, worldline));

  // 3. 世界线背景
  parts.push('\n===== 世界背景 =====');
  parts.push(`世界类型: ${worldline.worldType || 'historical'}`);
  parts.push(`历史背景: ${worldline.historicalBackground}`);
  if (worldline.physicsRules) {
    parts.push(`物理规则: ${worldline.physicsRules}`);
  }
  if (worldline.magicSystem) {
    parts.push(`魔法体系: ${worldline.magicSystem}`);
  }

  // 4. 激活的 Lorebook 条目
  if (activatedLorebookEntries.length > 0) {
    parts.push('\n===== 世界知识 (Lorebook) =====');
    parts.push('以下是当前情境相关的世界背景知识，请在叙事时自然融入：');
    activatedLorebookEntries.forEach((entry, index) => {
      parts.push(`\n[知识条目 ${index + 1}]`);
      parts.push(entry);
    });
  }

  // 5. 叙事指导
  parts.push('\n===== 叙事指导 =====');
  parts.push('- 根据角色的属性、天赋和背景生成合适的故事情节');
  parts.push('- 在需要判定时，明确说明需要判定的属性或技能');
  parts.push('- 保持叙事简洁有力，每次回应控制在 2-3 段');
  parts.push('- 给玩家明确的选择或行动提示');

  return parts.join('\n');
}

/**
 * 生成游戏 AI 响应（带 Lorebook 注入）
 * @param config AI 配置
 * @param character 角色信息
 * @param worldline 世界线信息
 * @param messageHistory 对话历史
 * @param dmPrompt DM 提示词
 * @returns AI 响应
 */
export async function generateGameResponse(
  config: AIConfig,
  character: Character,
  worldline: Worldline,
  messageHistory: Message[],
  dmPrompt: string
): Promise<AIResponse> {
  const startTime = Date.now();

  log.info('开始生成 AI 响应', { context: 'AIService' });

  // 1. 激活 Lorebook 条目
  let activatedEntries: string[] = [];
  if (worldline.lorebook) {
    const recentMessages = messageHistory
      .slice(-10)  // 取最近 10 条消息
      .map(msg => msg.content);

    activatedEntries = lorebookService.activateEntries(
      worldline.lorebook,
      recentMessages,
      messageHistory.length
    );

    log.debug(
      `Lorebook 激活了 ${activatedEntries.length} 个条目`,
      { context: 'AIService' }
    );
  }

  // 2. 构建系统提示词
  const systemPrompt = buildSystemPrompt(
    character,
    worldline,
    dmPrompt,
    activatedEntries
  );

  // 3. 构建消息列表
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messageHistory.map(msg => ({
      role: msg.role === 'system' ? 'system' : (msg.role === 'user' ? 'user' : 'assistant'),
      content: msg.content,
    } as AIMessage)),
  ];

  // 4. 调用 AI
  try {
    const response = await generateAIResponse(config, messages);

    log.timing('AI 响应生成', startTime, { context: 'AIService' });

    if (response.usage) {
      log.debug(
        `Token 使用: prompt=${response.usage.promptTokens}, completion=${response.usage.completionTokens}, total=${response.usage.totalTokens}`,
        { context: 'AIService' }
      );
    }

    return response;
  } catch (error) {
    log.error('AI 响应生成失败', error as Error, { context: 'AIService' });
    throw error;
  }
}

/**
 * 生成游戏开场白
 */
export async function generateOpeningMessage(
  config: AIConfig,
  character: Character,
  worldline: Worldline,
  dmPrompt: string
): Promise<string> {
  log.info('生成开场白', { context: 'AIService' });

  // 使用空的消息历史和特殊提示
  const openingPrompt = `现在是游戏开始，请为玩家生成一段引人入胜的开场白。

要求：
1. 描绘角色当前所处的场景和环境
2. 体现世界线的时代特征和氛围
3. 暗示可能的冲突或挑战
4. 以第二人称("你")与玩家对话
5. 控制在 2-3 段，留下悬念

开场白应该让玩家立即进入角色，感受到这个世界的真实性。`;

  const response = await generateGameResponse(
    config,
    character,
    worldline,
    [{ role: 'user', content: openingPrompt, timestamp: new Date().toISOString() }],
    dmPrompt
  );

  return response.content;
}
