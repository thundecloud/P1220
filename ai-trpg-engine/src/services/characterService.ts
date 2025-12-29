import { clampedNormalRandom, weightedRandom } from '../utils/random';
import { log } from './logService';
import type {
  Worldline,
  Talent,
  TalentRarity,
  BasicAttributes,
  DerivedAttributes,
  CharacterAttributes,
  Skill,
  Character,
  CharacterCreationMode,
  NarrativeDescription,
  DetailedProfile,
} from '../utils/types';

// 稀有度权重映射
const RARITY_WEIGHTS: Record<TalentRarity, number> = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 8,
  legendary: 2,
};

// ============ COC风格属性生成 ============

/**
 * 根据世界线参数生成COC风格的8项基础属性
 */
export function generateBasicAttributes(worldline: Worldline): BasicAttributes {
  log.debug(`生成基础属性: 世界线=${worldline.name}`, { context: 'CharacterService' });
  const params = worldline.attributeParams;

  const attrs = {
    strength: Math.round(
      clampedNormalRandom(params.strength.mu, params.strength.sigma, 0, 100)
    ),
    constitution: Math.round(
      clampedNormalRandom(params.constitution.mu, params.constitution.sigma, 0, 100)
    ),
    dexterity: Math.round(
      clampedNormalRandom(params.dexterity.mu, params.dexterity.sigma, 0, 100)
    ),
    intelligence: Math.round(
      clampedNormalRandom(params.intelligence.mu, params.intelligence.sigma, 0, 100)
    ),
    education: Math.round(
      clampedNormalRandom(params.education.mu, params.education.sigma, 0, 100)
    ),
    power: Math.round(
      clampedNormalRandom(params.power.mu, params.power.sigma, 0, 100)
    ),
    charisma: Math.round(
      clampedNormalRandom(params.charisma.mu, params.charisma.sigma, 0, 100)
    ),
    luck: Math.round(
      clampedNormalRandom(params.luck.mu, params.luck.sigma, 0, 100)
    ),
  };

  log.info(
    `基础属性生成完成: STR=${attrs.strength} CON=${attrs.constitution} DEX=${attrs.dexterity} INT=${attrs.intelligence} EDU=${attrs.education} POW=${attrs.power} CHA=${attrs.charisma} LUC=${attrs.luck}`,
    { context: 'CharacterService' }
  );

  return attrs;
}

/**
 * 计算派生属性
 */
export function calculateDerivedAttributes(
  basic: BasicAttributes,
  age: number = 20
): DerivedAttributes {
  log.debug(`计算派生属性: 年龄=${age}`, { context: 'CharacterService' });

  // HP = (CON + STR) / 10，向下取整
  const hitPoints = Math.floor((basic.constitution + basic.strength) / 10);

  // SAN = POW
  const sanity = basic.power;

  // MP = POW / 5，向下取整
  const magicPoints = Math.floor(basic.power / 5);

  // MOV (移动力) 基于年龄和DEX/STR
  let movement = 8; // 基础移动力
  if (age >= 40 && (basic.dexterity < 50 || basic.strength < 50)) {
    movement = 7;
  }
  if (age >= 80) {
    movement = 5;
  }
  if (basic.dexterity < 30 && basic.strength < 30) {
    movement = 6;
  }

  log.debug(
    `派生属性计算完成: HP=${hitPoints} SAN=${sanity} MP=${magicPoints} MOV=${movement}`,
    { context: 'CharacterService' }
  );

  return {
    hitPoints,
    sanity,
    magicPoints,
    movement,
  };
}

/**
 * 生成完整的角色属性（新版COC风格）
 */
export function generateCharacterAttributes(
  worldline: Worldline,
  age: number = 20
): CharacterAttributes {
  log.info(`生成角色属性: 世界线=${worldline.name}, 年龄=${age}`, { context: 'CharacterService' });

  const basic = generateBasicAttributes(worldline);
  const derived = calculateDerivedAttributes(basic, age);

  // 初始技能列表为空，将在角色创建流程中填充
  const skills: Skill[] = [];

  log.info('角色属性生成完成', { context: 'CharacterService' });

  return {
    basic,
    derived,
    skills,
  };
}

/**
 * 重新投骰基础属性
 */
export function rerollBasicAttributes(worldline: Worldline): BasicAttributes {
  log.info(`重新投骰基础属性: 世界线=${worldline.name}`, { context: 'CharacterService' });
  return generateBasicAttributes(worldline);
}

// ============ 天赋系统（保留原有逻辑）============

/**
 * 从天赋池中抽取天赋
 * @param allTalents 所有天赋数据
 * @param poolIds 该世界线可用的天赋池ID
 * @param count 要抽取的数量
 * @returns 抽取的天赋数组
 */
export function drawTalents(
  allTalents: Talent[],
  poolIds: string[],
  count: number = 9
): Talent[] {
  log.debug(`抽取天赋: 池IDs=${poolIds.join(',')}, 数量=${count}`, { context: 'CharacterService' });

  // 筛选出该世界线可用的天赋
  const availableTalents = allTalents.filter((talent) =>
    poolIds.includes(talent.poolId)
  );

  log.debug(`可用天赋数量: ${availableTalents.length}`, { context: 'CharacterService' });

  if (availableTalents.length < count) {
    log.error(`天赋池不足: 需要${count}个, 只有${availableTalents.length}个`, undefined, { context: 'CharacterService' });
    throw new Error(`天赋池中的天赋数量不足。需要${count}个，但只有${availableTalents.length}个可用。`);
  }

  // 按稀有度加权随机抽取
  const drawn: Talent[] = [];
  const talentPool = [...availableTalents];

  while (drawn.length < count && talentPool.length > 0) {
    // 计算每个天赋的权重
    const weights = talentPool.map((t) => RARITY_WEIGHTS[t.rarity]);

    // 加权随机选择
    const selected = weightedRandom(talentPool, weights);
    drawn.push(selected);
    log.debug(`抽取天赋: ${selected.name} (${selected.rarity})`, { context: 'CharacterService' });

    // 从池中移除已选择的天赋
    const index = talentPool.indexOf(selected);
    talentPool.splice(index, 1);
  }

  log.info(`天赋抽取完成: ${drawn.map(t => t.name).join(', ')}`, { context: 'CharacterService' });

  return drawn;
}

/**
 * 将抽取的天赋分组(3组,每组3个)
 */
export function groupTalents(talents: Talent[]): Talent[][] {
  log.debug(`天赋分组: ${talents.length}个天赋`, { context: 'CharacterService' });

  if (talents.length !== 9) {
    log.error(`天赋数量不正确: ${talents.length} (需要9个)`, undefined, { context: 'CharacterService' });
    throw new Error('需要正好9个天赋才能分组');
  }

  const groups = [talents.slice(0, 3), talents.slice(3, 6), talents.slice(6, 9)];
  log.debug('天赋分组完成: 3组x3个', { context: 'CharacterService' });

  return groups;
}

/**
 * 重新抽取某一组天赋
 */
export function rerollTalentGroup(
  allTalents: Talent[],
  poolIds: string[],
  excludedTalents: Talent[]
): Talent[] {
  log.info(`重新抽取天赋组: 排除${excludedTalents.length}个已选天赋`, { context: 'CharacterService' });

  const availableTalents = allTalents.filter(
    (talent) =>
      poolIds.includes(talent.poolId) &&
      !excludedTalents.some((excluded) => excluded.id === talent.id)
  );

  log.debug(`可用天赋: ${availableTalents.length}个`, { context: 'CharacterService' });

  if (availableTalents.length < 3) {
    log.error('可用天赋不足，无法重新抽取', undefined, { context: 'CharacterService' });
    throw new Error('可用天赋不足，无法重新抽取');
  }

  const drawn: Talent[] = [];
  const talentPool = [...availableTalents];

  while (drawn.length < 3 && talentPool.length > 0) {
    const weights = talentPool.map((t) => RARITY_WEIGHTS[t.rarity]);
    const selected = weightedRandom(talentPool, weights);
    drawn.push(selected);
    log.debug(`重抽天赋: ${selected.name} (${selected.rarity})`, { context: 'CharacterService' });

    const index = talentPool.indexOf(selected);
    talentPool.splice(index, 1);
  }

  log.info(`天赋组重抽完成: ${drawn.map(t => t.name).join(', ')}`, { context: 'CharacterService' });

  return drawn;
}

// ============ 角色创建 ============

/**
 * 创建新角色（支持多种创建模式）
 */
export function createCharacter(
  name: string,
  gender: 'male' | 'female' | 'other',
  worldlineId: string,
  _worldline: Worldline,
  backgrounds: string[],
  selectedTalents: Talent[],
  characterAttributes: CharacterAttributes | null,
  age: number = 20,
  story?: string,
  creationMode?: CharacterCreationMode,
  narrativeDescription?: NarrativeDescription,
  detailedProfile?: DetailedProfile,
  avatarUrl?: string
): Character {
  log.info(`创建角色: 名称=${name}, 性别=${gender}, 年龄=${age}, 模式=${creationMode || 'coc'}`, { context: 'CharacterService' });
  log.debug(`角色详情: 世界线=${worldlineId}, 背景数=${backgrounds.length}, 天赋数=${selectedTalents.length}`, { context: 'CharacterService' });

  // 为了向后兼容，创建一个简化的旧版attributes对象（仅当有characterAttributes时）
  const legacyAttributes = characterAttributes ? {
    constitution: characterAttributes.basic.constitution,
    perception: characterAttributes.basic.intelligence,
    adaptability: characterAttributes.basic.dexterity,
    familyBond: characterAttributes.basic.charisma,
    latentTalent: characterAttributes.basic.power,
  } : undefined;

  const characterId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const character: Character = {
    id: characterId,
    name,
    birthYear: new Date().getFullYear() - age,
    gender,
    worldlineId,
    backgrounds,
    characterAttributes: characterAttributes || undefined, // 新版COC风格属性（可选）
    attributes: legacyAttributes, // 旧版属性（向后兼容，可选）
    talents: selectedTalents.length > 0 ? selectedTalents : undefined,
    currentAge: age,
    createdAt: new Date().toISOString(),
    story: story || '',
    creationMode: creationMode || 'coc', // 默认为COC模式
    narrativeDescription: narrativeDescription, // 叙事描述（可选）
    detailedProfile: detailedProfile, // 详细履历（可选）
    avatarUrl: avatarUrl, // 角色头像（可选）
  };

  log.info(`角色创建成功: ID=${characterId}, 名称=${name}`, { context: 'CharacterService' });

  return character;
}

/**
 * 验证角色数据
 */
export function validateCharacter(character: Partial<Character>): boolean {
  log.debug(`验证角色数据: ${character.name || '未命名'}`, { context: 'CharacterService' });

  if (!character.name || character.name.trim().length === 0) {
    log.warn('角色验证失败: 缺少名称', { context: 'CharacterService' });
    return false;
  }

  if (!character.gender) {
    log.warn('角色验证失败: 缺少性别', { context: 'CharacterService' });
    return false;
  }

  if (!character.worldlineId) {
    log.warn('角色验证失败: 缺少世界线ID', { context: 'CharacterService' });
    return false;
  }

  if (!character.talents || character.talents.length !== 3) {
    log.warn(`角色验证失败: 天赋数量不正确 (${character.talents?.length || 0}/3)`, { context: 'CharacterService' });
    return false;
  }

  log.debug('角色验证通过', { context: 'CharacterService' });
  return true;
}

/**
 * 计算属性总和（用于显示）
 */
export function calculateAttributeSum(basic: BasicAttributes): number {
  return (
    basic.strength +
    basic.constitution +
    basic.dexterity +
    basic.intelligence +
    basic.education +
    basic.power +
    basic.charisma +
    basic.luck
  );
}

/**
 * 获取属性等级描述
 */
export function getAttributeLevel(value: number): string {
  if (value >= 90) return '超凡';
  if (value >= 75) return '优秀';
  if (value >= 60) return '良好';
  if (value >= 45) return '一般';
  if (value >= 30) return '较差';
  return '低下';
}
