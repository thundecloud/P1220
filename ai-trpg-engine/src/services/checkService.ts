/**
 * COC 7版风格判定系统
 *
 * 判定机制：
 * - 投掷 1d100，结果 <= 技能值为成功
 * - 大成功：01-05
 * - 成功：06 ~ 技能值
 * - 失败：技能值+1 ~ 95
 * - 大失败：96-100
 *
 * 困难等级：
 * - 普通：技能值
 * - 困难：技能值 / 2
 * - 极难：技能值 / 5
 */

import type { Check, CheckResult, AttributeKey, BasicAttributeKey } from '../utils/types';
import { log } from './logService';

export type Difficulty = 'normal' | 'hard' | 'extreme';

export const Difficulty = {
  NORMAL: 'normal' as Difficulty,
  HARD: 'hard' as Difficulty,
  EXTREME: 'extreme' as Difficulty,
} as const;

export interface CheckOptions {
  difficulty?: Difficulty;
  context?: string;  // 判定的上下文描述
  turn?: number;     // 当前回合数
}

export interface CheckResultDetail {
  result: CheckResult;
  diceValue: number;
  targetValue: number;
  modifiedValue: number;  // 根据难度调整后的目标值
  difficulty: Difficulty;
  check: Check;
}

/**
 * 判定服务类
 */
class CheckService {
  /**
   * 投掷 1d100
   */
  private rollD100(): number {
    return Math.floor(Math.random() * 100) + 1;
  }

  /**
   * 根据难度调整目标值
   */
  private applyDifficulty(value: number, difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.HARD:
        return Math.floor(value / 2);
      case Difficulty.EXTREME:
        return Math.floor(value / 5);
      case Difficulty.NORMAL:
      default:
        return value;
    }
  }

  /**
   * 判断判定结果
   */
  private determineResult(diceValue: number, modifiedValue: number): CheckResult {
    // 大成功：01-05
    if (diceValue <= 5) {
      return 'criticalSuccess';
    }

    // 大失败：96-100
    if (diceValue >= 96) {
      return 'criticalFailure';
    }

    // 成功：骰值 <= 调整后目标值
    if (diceValue <= modifiedValue) {
      return 'success';
    }

    // 失败
    return 'failure';
  }

  /**
   * 获取判定结果的中文描述
   */
  getResultLabel(result: CheckResult): string {
    const labels: Record<CheckResult, string> = {
      criticalSuccess: '大成功',
      success: '成功',
      failure: '失败',
      criticalFailure: '大失败',
    };
    return labels[result];
  }

  /**
   * 获取判定结果的颜色
   */
  getResultColor(result: CheckResult): string {
    const colors: Record<CheckResult, string> = {
      criticalSuccess: 'var(--color-neon-orange)',
      success: 'var(--color-terminal-green)',
      failure: 'var(--color-muted-foreground)',
      criticalFailure: 'var(--color-neon-magenta)',
    };
    return colors[result];
  }

  /**
   * 执行基础属性判定（COC风格）
   */
  checkBasicAttribute(
    attributeName: BasicAttributeKey,
    attributeValue: number,
    options: CheckOptions = {}
  ): CheckResultDetail {
    const {
      difficulty = Difficulty.NORMAL,
      context = `${attributeName}判定`,
      turn = 0,
    } = options;

    // 投掷骰子
    const diceValue = this.rollD100();

    // 应用难度调整
    const modifiedValue = this.applyDifficulty(attributeValue, difficulty);

    // 判断结果
    const result = this.determineResult(diceValue, modifiedValue);

    // 创建判定记录
    const check: Check = {
      turn,
      attribute: attributeName as AttributeKey,  // 类型兼容
      diceValue,
      attributeValue,
      result,
      context,
      timestamp: new Date().toISOString(),
    };

    // 记录日志
    log.debug(
      `判定执行: ${context} | 骰值=${diceValue} | 目标=${modifiedValue}/${attributeValue} | 结果=${this.getResultLabel(result)}`,
      { context: 'CheckService' }
    );

    return {
      result,
      diceValue,
      targetValue: attributeValue,
      modifiedValue,
      difficulty,
      check,
    };
  }

  /**
   * 执行技能判定
   */
  checkSkill(
    skillName: string,
    skillValue: number,
    options: CheckOptions = {}
  ): CheckResultDetail {
    const {
      difficulty = Difficulty.NORMAL,
      context = `${skillName}判定`,
      turn = 0,
    } = options;

    const diceValue = this.rollD100();
    const modifiedValue = this.applyDifficulty(skillValue, difficulty);
    const result = this.determineResult(diceValue, modifiedValue);

    // 技能判定的 Check 记录（使用特殊标记）
    const check: Check = {
      turn,
      attribute: 'constitution' as AttributeKey,  // 占位，技能判定不使用基础属性
      diceValue,
      attributeValue: skillValue,
      result,
      context: `技能: ${context}`,
      timestamp: new Date().toISOString(),
    };

    log.debug(
      `技能判定: ${context} | 骰值=${diceValue} | 目标=${modifiedValue}/${skillValue} | 结果=${this.getResultLabel(result)}`,
      { context: 'CheckService' }
    );

    return {
      result,
      diceValue,
      targetValue: skillValue,
      modifiedValue,
      difficulty,
      check,
    };
  }

  /**
   * 对抗判定（两个角色/NPC进行对抗）
   */
  opposedCheck(
    attacker: { name: string; value: number },
    defender: { name: string; value: number },
    options: CheckOptions = {}
  ): {
    attackerResult: CheckResultDetail;
    defenderResult: CheckResultDetail;
    winner: 'attacker' | 'defender' | 'draw';
  } {
    const { context = '对抗判定', turn = 0 } = options;

    // 双方分别投掷
    const attackerCheck = this.checkSkill(attacker.name, attacker.value, {
      ...options,
      context: `${context} (攻击方: ${attacker.name})`,
      turn,
    });

    const defenderCheck = this.checkSkill(defender.name, defender.value, {
      ...options,
      context: `${context} (防御方: ${defender.name})`,
      turn,
    });

    // 判断胜负
    let winner: 'attacker' | 'defender' | 'draw';

    if (
      attackerCheck.result === 'criticalSuccess' &&
      defenderCheck.result !== 'criticalSuccess'
    ) {
      winner = 'attacker';
    } else if (
      defenderCheck.result === 'criticalSuccess' &&
      attackerCheck.result !== 'criticalSuccess'
    ) {
      winner = 'defender';
    } else if (
      attackerCheck.result === 'success' &&
      defenderCheck.result === 'failure'
    ) {
      winner = 'attacker';
    } else if (
      defenderCheck.result === 'success' &&
      attackerCheck.result === 'failure'
    ) {
      winner = 'defender';
    } else {
      // 双方都成功或都失败，比较成功等级
      if (attackerCheck.diceValue < defenderCheck.diceValue) {
        winner = 'attacker';
      } else if (defenderCheck.diceValue < attackerCheck.diceValue) {
        winner = 'defender';
      } else {
        winner = 'draw';
      }
    }

    log.info(
      `对抗判定完成: ${context} | 胜者=${winner}`,
      { context: 'CheckService' }
    );

    return {
      attackerResult: attackerCheck,
      defenderResult: defenderCheck,
      winner,
    };
  }

  /**
   * 幸运判定
   */
  luckCheck(luckValue: number, options: CheckOptions = {}): CheckResultDetail {
    return this.checkBasicAttribute('luck', luckValue, {
      ...options,
      context: options.context || '幸运判定',
    });
  }

  /**
   * 理智判定（特殊判定）
   */
  sanityCheck(sanityValue: number, options: CheckOptions = {}): CheckResultDetail {
    return this.checkBasicAttribute('power', sanityValue, {
      ...options,
      context: options.context || '理智判定',
    });
  }

  /**
   * 批量判定（一次投多个骰子，取最好或最差结果）
   */
  multipleRolls(
    count: number,
    skillValue: number,
    takeBest: boolean = true,
    options: CheckOptions = {}
  ): CheckResultDetail {
    const rolls: CheckResultDetail[] = [];

    for (let i = 0; i < count; i++) {
      rolls.push(this.checkSkill(`多重判定 ${i + 1}`, skillValue, options));
    }

    // 根据 takeBest 选择最好或最差结果
    const selected = rolls.reduce((best, current) => {
      const priority = ['criticalFailure', 'failure', 'success', 'criticalSuccess'];
      const bestIdx = priority.indexOf(best.result);
      const currentIdx = priority.indexOf(current.result);

      if (takeBest) {
        return currentIdx > bestIdx ? current : best;
      } else {
        return currentIdx < bestIdx ? current : best;
      }
    });

    log.debug(
      `多重判定完成: ${count}次投掷 | 取${takeBest ? '最好' : '最差'}结果=${this.getResultLabel(selected.result)}`,
      { context: 'CheckService' }
    );

    return selected;
  }
}

// 导出单例
export const checkService = new CheckService();
export default checkService;
