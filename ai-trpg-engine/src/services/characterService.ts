import { clampedNormalRandom, weightedRandom, randomSample } from '../utils/random';
import type { Worldline, Talent, Attributes, Character, TalentRarity } from '../utils/types';

// 稀有度权重映射
const RARITY_WEIGHTS: Record<TalentRarity, number> = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 8,
  legendary: 2,
};

/**
 * 根据世界线参数生成角色属性
 */
export function generateAttributes(worldline: Worldline): Attributes {
  const params = worldline.attributeParams;

  return {
    constitution: clampedNormalRandom(
      params.constitution.mu,
      params.constitution.sigma,
      0,
      100
    ),
    perception: clampedNormalRandom(
      params.perception.mu,
      params.perception.sigma,
      0,
      100
    ),
    adaptability: clampedNormalRandom(
      params.adaptability.mu,
      params.adaptability.sigma,
      0,
      100
    ),
    familyBond: clampedNormalRandom(
      params.familyBond.mu,
      params.familyBond.sigma,
      0,
      100
    ),
    latentTalent: clampedNormalRandom(
      params.latentTalent.mu,
      params.latentTalent.sigma,
      0,
      100
    ),
  };
}

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
  // 筛选出该世界线可用的天赋
  const availableTalents = allTalents.filter((talent) =>
    poolIds.includes(talent.poolId)
  );

  if (availableTalents.length < count) {
    throw new Error('天赋池中的天赋数量不足');
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

    // 从池中移除已选择的天赋
    const index = talentPool.indexOf(selected);
    talentPool.splice(index, 1);
  }

  return drawn;
}

/**
 * 将抽取的天赋分组(3组,每组3个)
 */
export function groupTalents(talents: Talent[]): Talent[][] {
  if (talents.length !== 9) {
    throw new Error('需要正好9个天赋才能分组');
  }

  return [
    talents.slice(0, 3),
    talents.slice(3, 6),
    talents.slice(6, 9),
  ];
}

/**
 * 创建新角色
 */
export function createCharacter(
  name: string,
  gender: 'male' | 'female' | 'other',
  worldlineId: string,
  worldline: Worldline,
  backgrounds: string[],
  selectedTalents: Talent[]
): Character {
  const attributes = generateAttributes(worldline);

  return {
    id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    birthYear: 0, // 将由世界线确定
    gender,
    worldlineId,
    backgrounds,
    attributes,
    talents: selectedTalents,
    currentAge: 0,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 验证角色数据
 */
export function validateCharacter(character: Partial<Character>): boolean {
  if (!character.name || character.name.trim().length === 0) {
    return false;
  }

  if (!character.gender) {
    return false;
  }

  if (!character.worldlineId) {
    return false;
  }

  if (!character.talents || character.talents.length !== 3) {
    return false;
  }

  return true;
}
