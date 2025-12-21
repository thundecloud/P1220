import type { AIConfig, AIMessage, AIResponse, AIProvider } from '../utils/types';

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
    provider: 'gemini',
    apiKey: '',
    modelName: 'gemini-2.0-flash-exp',
    temperature: 1.0,
    maxTokens: 2048,
    topP: 0.95,
  };
}

/**
 * 预设模型列表
 */
export const MODEL_PRESETS: Record<AIProvider, Array<{ name: string; model: string }>> = {
  gemini: [
    { name: 'Gemini 2.0 Flash (实验)', model: 'gemini-2.0-flash-exp' },
    { name: 'Gemini 1.5 Flash', model: 'gemini-1.5-flash' },
    { name: 'Gemini 1.5 Pro', model: 'gemini-1.5-pro' },
  ],
  openai: [
    { name: 'GPT-4', model: 'gpt-4' },
    { name: 'GPT-4 Turbo', model: 'gpt-4-turbo-preview' },
    { name: 'GPT-3.5 Turbo', model: 'gpt-3.5-turbo' },
  ],
  anthropic: [
    { name: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-20241022' },
    { name: 'Claude 3 Opus', model: 'claude-3-opus-20240229' },
    { name: 'Claude 3 Haiku', model: 'claude-3-haiku-20240307' },
  ],
  custom: [],
};
