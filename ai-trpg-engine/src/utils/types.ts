// 世界线类型（新版本，支持COC风格）
export interface Worldline {
  id: string;
  name: string;
  description: string;
  era: string;
  region: string;
  culture: string[];
  historicalBackground: string;
  imageUrl?: string;  // 世界线封面图
  special: {
    challenges?: string[];
    opportunities?: string[];
  };

  // 新版COC风格属性生成参数
  attributeParams: {
    strength: { mu: number; sigma: number };
    constitution: { mu: number; sigma: number };
    dexterity: { mu: number; sigma: number };
    intelligence: { mu: number; sigma: number };
    education: { mu: number; sigma: number };
    power: { mu: number; sigma: number };
    charisma: { mu: number; sigma: number };
    luck: { mu: number; sigma: number };
  };

  talentPoolIds: string[];
  skillPoolIds: string[];  // 该世界线特有的技能池ID列表

  // 自定义世界线标记
  isCustom?: boolean;
  createdAt?: string;
  author?: string;
}

// 天赋稀有度
export type TalentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// 稀有度中文映射
export const RARITY_LABELS: Record<TalentRarity, string> = {
  common: '普通',
  uncommon: '罕见',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
};

// 稀有度颜色映射
export const RARITY_COLORS: Record<TalentRarity, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-[var(--color-terminal-green)]',
  rare: 'text-[var(--color-neon-cyan)]',
  epic: 'text-[var(--color-neon-magenta)]',
  legendary: 'text-[var(--color-neon-orange)]'
};

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

// ============ COC风格属性系统 ============

// 基础属性 (8项核心属性)
export interface BasicAttributes {
  strength: number;      // 力量 STR (0-100)
  constitution: number;  // 体质 CON (0-100)
  dexterity: number;     // 敏捷 DEX (0-100)
  intelligence: number;  // 智力 INT (0-100)
  education: number;     // 教育 EDU (0-100)
  power: number;         // 意志 POW (0-100)
  charisma: number;      // 魅力 CHA (0-100)
  luck: number;          // 幸运 LUC (0-100)
}

// 派生属性
export interface DerivedAttributes {
  hitPoints: number;     // 生命值 HP = (CON + STR) / 2
  sanity: number;        // 理智值 SAN = POW
  magicPoints: number;   // 魔力值 MP = POW / 5
  movement: number;      // 移动力 MOV (基于年龄和DEX/STR)
}

// 技能类型
export interface Skill {
  id: string;
  name: string;
  baseValue: number;      // 基础值 (0-100)
  currentValue: number;   // 当前值 (可通过训练提升)
  category: 'common' | 'worldline' | 'combat' | 'social' | 'knowledge' | 'craft';
  description: string;
}

// 角色完整属性（新版本，COC风格）
export interface CharacterAttributes {
  basic: BasicAttributes;
  derived: DerivedAttributes;
  skills: Skill[];
}

// 旧版属性接口（保留用于兼容）
export interface Attributes {
  constitution: number;
  perception: number;
  adaptability: number;
  familyBond: number;
  latentTalent: number;
}

export type AttributeKey = keyof Attributes;
export type BasicAttributeKey = keyof BasicAttributes;

// 角色类型（更新为支持新COC风格）
export interface Character {
  id: string;
  name: string;
  birthYear: number;
  gender: 'male' | 'female' | 'other';
  worldlineId: string;
  backgrounds: string[];

  // 新版COC风格属性（优先使用）
  characterAttributes?: CharacterAttributes;

  // 旧版属性（向后兼容）
  attributes: Attributes;

  talents: Talent[];
  currentAge: number;
  createdAt: string;

  // 角色头像（可选）
  avatarUrl?: string;

  // 角色故事/背景描述
  story?: string;
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

// AI模型预设配置
export interface ModelPreset {
  id: string;
  name: string;
  provider: string;
  apiBaseUrl: string;
  modelName: string;
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
    topP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
  };
  game: {
    dmStyle: string;
    dmPrompt: string;
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
