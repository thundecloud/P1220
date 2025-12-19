// 世界线类型
export interface Worldline {
  id: string;
  name: string;
  description: string;
  era: string;
  region: string;
  culture: string[];
  historicalBackground: string;
  special: {
    challenges?: string[];
    opportunities?: string[];
  };
  attributeParams: {
    constitution: { mu: number; sigma: number };
    perception: { mu: number; sigma: number };
    adaptability: { mu: number; sigma: number };
    familyBond: { mu: number; sigma: number };
    latentTalent: { mu: number; sigma: number };
  };
  talentPoolIds: string[];
}

// 天赋稀有度
export type TalentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// 天赋类型
export interface Talent {
  id: string;
  poolId: string;
  name: string;
  description: string;
  aiPromptFragment: string;
  rarity: TalentRarity;
  category: string;
  icon: string;
}

// 背景身份类型
export interface Background {
  id: string;
  worldlines: string[];
  name: string;
  description: string;
  effects: string;
}

// 角色属性
export interface Attributes {
  constitution: number;       // 体魄
  perception: number;          // 感知
  adaptability: number;        // 适应
  familyBond: number;          // 家族联系
  latentTalent: number;        // 潜在天赋
}

export type AttributeKey = keyof Attributes;

// 角色类型
export interface Character {
  id: string;
  name: string;
  birthYear: number;
  gender: 'male' | 'female' | 'other';
  worldlineId: string;
  backgrounds: string[];
  attributes: Attributes;
  talents: Talent[];
  currentAge: number;
  createdAt: string;
}

// 判定结果类型
export type CheckResult = 'criticalSuccess' | 'success' | 'failure' | 'criticalFailure';

// 判定记录
export interface Check {
  turn: number;
  attribute: AttributeKey;
  diceValue: number;
  attributeValue: number;
  result: CheckResult;
  context: string;
  timestamp: string;
}

// 消息类型
export interface Message {
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: string;
  metadata?: {
    checkResult?: Check;
    eventType?: string;
  };
}

// 游戏会话
export interface GameSession {
  id: string;
  characterId: string;
  dialogueHistory: Message[];
  eventLog: string[];
  checkHistory: Check[];
  currentTurn: number;
  status: 'active' | 'paused' | 'ended';
  lastSavedAt: string;
}

// 存档数据
export interface SaveData {
  version: string;
  character: Character;
  gameSession: GameSession;
  metadata: {
    createdAt: string;
    lastSavedAt: string;
    playTime: number;
  };
}

// 应用配置
export interface AppConfig {
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
