// ============ Lorebook / World Info 系统 ============

/**
 * Lorebook条目 - 用于动态注入世界背景信息
 * 基于SillyTavern的World Info系统设计
 */
export interface LorebookEntry {
  id: string;
  title: string;                    // 条目标题(便于管理)
  keys: string[];                   // 触发关键词列表
  content: string;                  // 注入到AI提示词的内容
  enabled: boolean;                 // 是否启用此条目
  insertionOrder: number;           // 优先级(越大越靠后,影响力越强)
  memo?: string;                    // 备注信息

  // 高级选项
  caseSensitive?: boolean;          // 是否区分大小写(默认false)
  useRegex?: boolean;               // 是否使用正则表达式(默认false)

  // 次级过滤
  secondaryKeys?: string[];         // 次级关键词
  secondaryKeysLogic?: 'AND_ANY' | 'AND_ALL' | 'NOT_ANY' | 'NOT_ALL';

  // 定时机制
  sticky?: number;                  // 激活后保持N条消息
  cooldown?: number;                // 激活后N条消息内不可重新触发
  delay?: number;                   // 至少有N条消息才可激活

  // 包含组(同组内仅一个被激活)
  inclusionGroup?: string;
  groupWeight?: number;             // 组内权重(默认100)

  createdAt?: string;
  updatedAt?: string;
}

/**
 * Lorebook配置
 */
export interface Lorebook {
  id: string;
  name: string;
  description?: string;
  entries: LorebookEntry[];

  // 扫描配置
  scanDepth?: number;               // 扫描最后N条消息(0=仅递归,默认10)
  recursiveScanning?: boolean;      // 是否启用递归扫描(默认true)

  // 上下文预算
  budgetEnabled?: boolean;
  budgetCap?: number;               // 最大token数
  budgetPriority?: 'order' | 'activation'; // 预算分配策略

  createdAt?: string;
  updatedAt?: string;
}

// ============ 大型设定集支持 ============

/**
 * 设定文档类型
 */
export interface SettingDocument {
  title: string;
  content: string;              // Markdown或纯文本格式
  format: 'markdown' | 'plaintext';
  category?: string;            // 分类：世界观、历史、地理、文化、政治等
  tags?: string[];              // 标签
  lastModified?: string;
}

/**
 * 设定集分类
 */
export interface SettingCategory {
  id: string;
  name: string;
  description?: string;
  documents: SettingDocument[];
  subcategories?: SettingCategory[];
}

// 世界线类型（新版本，支持COC风格 + Lorebook + 大型设定集）
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

  // ★ Lorebook配置（用于动态上下文注入）
  lorebook?: Lorebook;

  // ★ 新增：大型设定集支持
  settingDocument?: SettingDocument;      // 单个大型设定文档
  settingCategories?: SettingCategory[];  // 分类的设定集合
  settingSize?: number;                   // 设定总大小（字节）
  settingAutoSplit?: boolean;             // 是否自动将大型设定拆分为Lorebook条目

  // 自定义世界线标记
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  version?: string;
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

// ============ SillyTavern Character Card V2 兼容 ============

/**
 * Character Card V2 数据结构
 * 完全兼容 SillyTavern 的 Character Card V2 规范
 */
export interface CharacterCardV2Data {
  // V1 继承字段
  name: string;
  description: string;              // 角色描述
  personality: string;              // 性格特征
  scenario: string;                 // 场景设定
  first_mes: string;                // 首条问候语
  mes_example: string;              // 消息示例

  // V2 新增字段
  creator_notes?: string;           // 创作者备注（不用于提示）
  system_prompt?: string;           // 自定义系统提示
  post_history_instructions?: string; // 对话历史后的指令
  alternate_greetings?: string[];   // 备选问候语
  character_book?: Lorebook;        // 嵌入式 Lorebook
  tags?: string[];                  // 标签（用于分类，不用于提示）
  creator?: string;                 // 创建者
  character_version?: string;       // 版本号
  extensions?: Record<string, any>; // 扩展数据
}

/**
 * Character Card V2 完整结构
 */
export interface CharacterCardV2 {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: CharacterCardV2Data;
}

// 角色类型（更新为支持新COC风格 + SillyTavern V2兼容）
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

  // ★ SillyTavern V2 兼容字段
  characterCard?: CharacterCardV2Data;  // 完整的 V2 数据
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
