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

  // ★ 基础设定（可选，支持完全架空世界）
  era: string;                            // 时代（可以是架空的，如"星历2347年"）
  region: string;                         // 地区（可以是架空的，如"赛博都市夜之城"）
  culture: string[];                      // 文化标签
  historicalBackground: string;           // 历史背景
  imageUrl?: string;                      // 世界线封面图

  // ★ 自由世界观设定（支持完全自定义的世界）
  worldType?: 'historical' | 'alternate_history' | 'fantasy' | 'sci-fi' | 'cyberpunk' | 'post_apocalyptic' | 'custom';
  physicsRules?: string;                  // 物理规则（如"魔法存在"、"赛博改造普及"）
  technologyLevel?: string;               // 科技水平（如"中世纪"、"星际时代"）
  magicSystem?: string;                   // 魔法体系描述
  socialStructure?: string;               // 社会结构（如"赛博朋克企业统治"、"封建制度"）
  currency?: string;                      // 货币系统（如"金币"、"信用点"、"以太币"）

  special: {
    challenges?: string[];                // 世界特有挑战
    opportunities?: string[];             // 世界特有机遇
    uniqueFeatures?: string[];            // 独特特性（如"AI觉醒"、"龙族存在"）
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

  // ★ 新增：大型设定集支持（多文件、目录结构）
  settingDocument?: SettingDocument;      // 单个大型设定文档
  settingCategories?: SettingCategory[];  // 分类的设定集合（支持目录层次结构）
  settingSize?: number;                   // 设定总大小（字节）
  settingAutoSplit?: boolean;             // 是否自动将大型设定拆分为Lorebook条目
  settingFileCount?: number;              // 设定文件数量

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

// ============ 简历级角色详细信息 ============

/**
 * 教育经历
 */
export interface Education {
  institution: string;      // 机构名称
  degree?: string;          // 学位/证书
  field?: string;           // 专业领域
  startYear?: number;
  endYear?: number;
  description?: string;     // 描述
}

/**
 * 工作/职业经历
 */
export interface WorkExperience {
  organization: string;     // 组织/雇主
  position: string;         // 职位
  startYear?: number;
  endYear?: number;
  description?: string;     // 职责描述
  achievements?: string[];  // 成就
}

/**
 * 人际关系
 */
export interface Relationship {
  name: string;             // 关系对象名称
  relation: string;         // 关系类型（父母、朋友、导师等）
  description?: string;     // 关系描述
  status?: 'alive' | 'deceased' | 'unknown';  // 状态
  influence?: string;       // 对角色的影响
}

/**
 * 性格特征
 */
export interface PersonalityTrait {
  trait: string;            // 特征名称
  description?: string;     // 描述
  intensity?: number;       // 强度 (0-100)
}

/**
 * 外貌描述
 */
export interface PhysicalAppearance {
  height?: string;          // 身高
  weight?: string;          // 体重
  eyeColor?: string;        // 眼睛颜色
  hairColor?: string;       // 发色
  skinTone?: string;        // 肤色
  distinguishingFeatures?: string[];  // 显著特征
  generalDescription?: string;        // 总体描述
}

/**
 * 简历级详细信息（放在高级设置中）
 */
export interface DetailedProfile {
  // 教育背景
  education?: Education[];

  // 工作经历
  workExperience?: WorkExperience[];

  // 人际关系
  relationships?: Relationship[];

  // 性格特征
  personality?: PersonalityTrait[];

  // 外貌描述
  appearance?: PhysicalAppearance;

  // 信仰与价值观
  beliefs?: string[];
  values?: string[];

  // 恐惧与弱点
  fears?: string[];
  weaknesses?: string[];

  // 目标与动机
  goals?: string[];
  motivations?: string[];

  // 爱好与兴趣
  hobbies?: string[];
  interests?: string[];

  // 语言能力
  languages?: Array<{
    language: string;
    proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
  }>;

  // 财产与资源
  wealth?: string;          // 财富等级
  property?: string[];      // 财产列表
  connections?: string[];   // 人脉资源

  // 重要事件
  majorEvents?: Array<{
    year: number;
    event: string;
    impact?: string;
  }>;

  // 其他备注
  notes?: string;
}

// ============ 角色创建模式 ============

/**
 * 角色创建模式
 */
export type CharacterCreationMode = 'narrative' | 'coc' | 'hybrid';

/**
 * 叙事导向的角色描述（SillyTavern风格）
 */
export interface NarrativeDescription {
  // 核心描述性字段
  description: string;          // 角色描述（外貌、性格、背景的自由文本）
  personality: string;          // 性格特征（自由文本）
  scenario: string;             // 场景/情境（角色所处的情境）
  firstMessage?: string;        // 首条问候语（角色的第一句话）
  exampleDialogs?: string;      // 对话示例（用\n分隔的多轮对话）

  // 补充信息
  likes?: string;               // 喜好
  dislikes?: string;            // 厌恶
  background?: string;          // 详细背景故事
  speech?: string;              // 说话风格
  thinking?: string;            // 思维方式
}

// 角色类型（更新为支持新COC风格 + SillyTavern V2兼容 + 简历级详细信息 + 自由创建模式）
export interface Character {
  id: string;
  name: string;

  // ★ 创建模式（决定使用哪些字段）
  creationMode?: CharacterCreationMode;  // 默认 'coc'

  // ★ 叙事导向字段（narrative/hybrid 模式）
  narrativeDescription?: NarrativeDescription;

  // COC/游戏化字段（coc/hybrid 模式）
  birthYear?: number;           // 可选，叙事模式不需要
  gender?: 'male' | 'female' | 'other';  // 可选
  worldlineId: string;
  backgrounds?: string[];       // 可选

  // 新版COC风格属性（可选，仅 coc/hybrid 模式）
  characterAttributes?: CharacterAttributes;

  // 旧版属性（向后兼容，可选）
  attributes?: Attributes;

  talents?: Talent[];           // 可选
  currentAge?: number;          // 可选
  createdAt: string;

  // 角色头像（可选）
  avatarUrl?: string;

  // 角色故事/背景描述（已废弃，使用 narrativeDescription.background）
  story?: string;

  // ★ SillyTavern V2 兼容字段
  characterCard?: CharacterCardV2Data;  // 完整的 V2 数据

  // ★ 简历级详细信息（高级设置，可选）
  detailedProfile?: DetailedProfile;
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

// ============ AI 服务类型 ============

/**
 * 支持的 AI 提供商
 */
export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'custom';

/**
 * AI 模型预设配置
 */
export interface ModelPreset {
  id: string;
  name: string;
  provider: AIProvider;
  apiBaseUrl: string;
  modelName: string;
  maxTokens?: number;
}

/**
 * AI 请求消息
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI 响应
 */
export interface AIResponse {
  content: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * AI 配置
 */
export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  apiBaseUrl?: string;        // 自定义端点（可选）
  modelName: string;
  temperature?: number;       // 0-2，默认 1.0
  maxTokens?: number;         // 最大生成 token 数
  topP?: number;              // 0-1，默认 1.0
  presencePenalty?: number;   // -2 到 2（OpenAI）
  frequencyPenalty?: number;  // -2 到 2（OpenAI）
}

/**
 * 应用配置
 */
export interface AppConfig {
  ai: AIConfig;
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
