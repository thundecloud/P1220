/**
 * Box-Muller变换生成正态分布随机数
 * @param mu 均值
 * @param sigma 标准差
 * @returns 符合正态分布的随机数
 */
export function normalRandom(mu: number = 0, sigma: number = 1): number {
  // Box-Muller变换
  const u1 = Math.random();
  const u2 = Math.random();

  // 生成标准正态分布随机数
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // 转换到指定均值和标准差
  return z0 * sigma + mu;
}

/**
 * 生成限定范围内的正态分布随机数
 * @param mu 均值
 * @param sigma 标准差
 * @param min 最小值
 * @param max 最大值
 * @returns 符合正态分布且在范围内的随机数
 */
export function clampedNormalRandom(
  mu: number,
  sigma: number,
  min: number = 0,
  max: number = 100
): number {
  let value = normalRandom(mu, sigma);

  // 截断到指定范围
  value = Math.max(min, Math.min(max, value));

  // 四舍五入到整数
  return Math.round(value);
}

/**
 * 生成0-100之间的均匀分布随机整数
 * @returns 0-100之间的随机整数
 */
export function uniformRandom(min: number = 0, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 加权随机选择
 * @param items 项目数组
 * @param weights 对应的权重数组
 * @returns 被选中的项目
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights arrays must have the same length');
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  // 兜底返回最后一项
  return items[items.length - 1];
}

/**
 * 从数组中随机选择n个不重复的元素
 * @param array 源数组
 * @param count 要选择的数量
 * @returns 随机选择的元素数组
 */
export function randomSample<T>(array: T[], count: number): T[] {
  if (count > array.length) {
    throw new Error('Count cannot be greater than array length');
  }

  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
