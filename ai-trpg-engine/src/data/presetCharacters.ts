/**
 * 预设角色模板
 * 提供多种经典TRPG角色原型供玩家快速开始游戏
 */

import type { NarrativeDescription, CharacterAttributes } from '../utils/types';

export interface PresetCharacterTemplate {
  id: string;
  name: string;
  description: string;
  category: '战士' | '法师' | '盗贼' | '学者' | '探险家' | '贵族' | '神秘主义者';
  worldlineId: string;  // 推荐的世界线ID
  creationMode: 'narrative' | 'coc' | 'hybrid';

  // 基础信息
  gender: 'male' | 'female' | 'other';
  birthYear?: number;

  // 叙事描述（narrative 模式）
  narrativeDescription?: NarrativeDescription;

  // COC 属性（coc 模式）
  characterAttributes?: Partial<CharacterAttributes>;

  // 天赋（可选）
  talentIds?: string[];
}

/**
 * 预设角色模板列表
 */
export const PRESET_CHARACTERS: PresetCharacterTemplate[] = [
  // === 叙事模式角色 ===
  {
    id: 'wandering_swordsman',
    name: '流浪剑客',
    description: '背负着过往秘密的神秘剑士，行侠仗义却不愿透露真名',
    category: '战士',
    worldlineId: 'default',
    creationMode: 'narrative',
    gender: 'male',
    narrativeDescription: {
      description: '一位身材颀长的剑客，身穿破旧但干净的旅行斗篷。腰间佩戴着一柄看似普通却保养极佳的长剑。眼神深邃，似乎藏着不为人知的故事。脸上有一道浅浅的疤痕，为他增添了几分沧桑。',
      personality: '沉默寡言，但内心正直。不喜欢多管闲事，却无法坐视不义之事发生。对过去讳莫如深，但对未来充满希望。喜欢独处，但并不排斥真诚的友谊。',
      scenario: '你正在一座陌生的城镇中寻找关于过去的线索。昔日的荣耀已成往事，现在你只是一个无名的流浪者。但剑在手，心中的正义之火从未熄灭。',
      firstMessage: '又是一座陌生的城镇...不过，这里似乎不太平静。',
      background: '曾是某个骑士团的精锐成员，因为一场阴谋被陷害而逃亡。多年的流浪生涯磨练了剑技，也让他学会了如何在乱世中生存。他一直在寻找能证明自己清白的证据，同时也在寻找当年陷害他的真凶。',
      likes: '清晨的剑术练习、公正的决斗、帮助弱者',
      dislikes: '背叛、不公、虚伪的贵族',
      speech: '简洁直接，很少废话。说话时常常停顿，似乎在斟酌用词。',
      thinking: '习惯从多个角度思考问题，谨慎但不优柔寡断。',
    },
  },
  {
    id: 'mysterious_scholar',
    name: '神秘学者',
    description: '沉迷于古代典籍的年轻学者，对未知充满好奇',
    category: '学者',
    worldlineId: 'default',
    creationMode: 'narrative',
    gender: 'female',
    narrativeDescription: {
      description: '一位戴着圆框眼镜的年轻女性，总是抱着厚重的古书。穿着学者的长袍，上面绣着神秘的符文。手指上沾着墨迹，眼睛因长期阅读而略显疲惫，但闪烁着智慧的光芒。',
      personality: '好奇心旺盛，对知识有近乎痴迷的追求。性格温和但固执，一旦决定研究某个课题就会全身心投入。有时会因为过于专注而忽略周围的危险。',
      scenario: '你在图书馆的禁书区发现了一本记载着失落文明的古籍。书中提到的秘密让你既兴奋又不安。为了验证书中的内容，你决定踏上一场考古之旅。',
      firstMessage: '根据这本古籍的记载，真相应该就在附近...我一定要找到它！',
      background: '出身于学者世家，从小就对古代文明充满兴趣。在大学任教期间，她发现了一些被主流学术界忽视的古代文献，这些发现让她开始质疑历史的真实性。',
      likes: '古代典籍、考古发现、深夜研究、浓茶',
      dislikes: '无知的偏见、被打断思路、烧毁书籍',
      speech: '说话时会引用典籍，喜欢用学术术语。激动时语速会变快。',
      thinking: '逻辑严密，善于从细节中发现规律。但有时会过度解读。',
    },
  },
  {
    id: 'street_thief',
    name: '街头小偷',
    description: '在贫民窟长大的灵活盗贼，靠偷窃技艺生存',
    category: '盗贼',
    worldlineId: 'default',
    creationMode: 'narrative',
    gender: 'other',
    narrativeDescription: {
      description: '身材瘦小灵活，穿着不起眼的破旧衣服方便混入人群。手指修长灵活，眼神机警。脸上总带着一丝狡黠的笑容，但眼底偶尔会流露出一丝脆弱。',
      personality: '机警狡猾，但并非没有底线。只偷富人，从不对穷人下手。表面玩世不恭，内心渴望被认可。对信任的人极度忠诚。',
      scenario: '你刚刚偷到了一个看起来很值钱的挂坠，但很快发现它似乎并不简单——有人正在追踪它。现在你必须决定是把它卖掉换钱，还是弄清楚它的秘密。',
      firstMessage: '啧，这东西比我想象的烫手多了...但也更有意思。',
      background: '父母早逝，在贫民窟长大。为了生存学会了偷窃和扒手技术。曾经被一个老盗贼收养并传授技艺，但老人已经去世。现在独自在街头谋生，梦想着有一天能金盆洗手。',
      likes: '自由、刺激、闪亮的东西、街头美食',
      dislikes: '贵族的傲慢、被关住、背叛',
      speech: '说话带着街头俚语，语速较快。喜欢用玩笑掩饰不安。',
      thinking: '反应迅速，善于临机应变。习惯为最坏情况做准备。',
    },
  },

  // === 混合模式角色（叙事 + COC属性）===
  {
    id: 'detective_investigator',
    name: '私家侦探',
    description: '富有洞察力的调查员，专门处理离奇案件',
    category: '探险家',
    worldlineId: 'default',
    creationMode: 'hybrid',
    gender: 'male',
    narrativeDescription: {
      description: '穿着整洁的风衣和礼帽的中年男性。总是随身携带一个笔记本和放大镜。眼神锐利，善于观察细节。',
      personality: '冷静理性，逻辑思维强。但有时过于执着于真相。对超自然现象持怀疑态度，但经验让他不得不承认世界上确实存在科学无法解释的事物。',
      scenario: '你接到一个奇怪的委托——调查一座据说闹鬼的老宅。委托人愿意支付高额报酬，但你怀疑事情并不简单。',
      background: '曾是警察，因为调查一起离奇案件而辞职成为私家侦探。那起案件让他意识到这个世界比表面看起来更加黑暗和神秘。',
    },
    characterAttributes: {
      basic: {
        strength: 60,
        constitution: 65,
        dexterity: 70,
        intelligence: 80,  // 高智力
        education: 75,
        power: 60,
        charisma: 65,
        luck: 55,
      },
      derived: {
        hitPoints: 63,
        sanity: 60,
        magicPoints: 12,
        movement: 8,
      },
      skills: [
        { id: 'spot_hidden', name: '侦查', baseValue: 25, currentValue: 75, category: 'common', description: '发现隐藏的线索' },
        { id: 'psychology', name: '心理学', baseValue: 10, currentValue: 60, category: 'knowledge', description: '理解他人心理' },
        { id: 'library_use', name: '图书馆使用', baseValue: 20, currentValue: 65, category: 'knowledge', description: '查找信息' },
        { id: 'persuade', name: '说服', baseValue: 10, currentValue: 55, category: 'social', description: '说服他人' },
        { id: 'law', name: '法律', baseValue: 5, currentValue: 50, category: 'knowledge', description: '法律知识' },
      ],
    },
  },
  {
    id: 'occult_mystic',
    name: '神秘学家',
    description: '研究超自然现象的学者，掌握一些古老的仪式',
    category: '神秘主义者',
    worldlineId: 'default',
    creationMode: 'hybrid',
    gender: 'female',
    narrativeDescription: {
      description: '穿着深色长袍的神秘女性，总是佩戴着各种护身符和符文饰品。手中常拿着一本古老的魔法书。',
      personality: '对神秘学充满热情，相信超自然力量的存在。谨慎而神秘，不轻易透露自己的秘密。',
      scenario: '你感应到一股强大的超自然力量正在觉醒。这可能是一个重大发现，也可能是一场灾难的开始。',
      background: '从祖母那里继承了神秘学知识和一本古老的魔法典籍。多年来一直在研究和实践各种仪式，试图揭开世界的真实面貌。',
    },
    characterAttributes: {
      basic: {
        strength: 45,
        constitution: 50,
        dexterity: 55,
        intelligence: 75,
        education: 70,
        power: 85,  // 高意志力
        charisma: 60,
        luck: 50,
      },
      derived: {
        hitPoints: 48,
        sanity: 85,
        magicPoints: 17,
        movement: 8,
      },
      skills: [
        { id: 'occult', name: '神秘学', baseValue: 5, currentValue: 80, category: 'knowledge', description: '超自然知识' },
        { id: 'library_use', name: '图书馆使用', baseValue: 20, currentValue: 70, category: 'knowledge', description: '查找信息' },
        { id: 'history', name: '历史', baseValue: 5, currentValue: 55, category: 'knowledge', description: '历史知识' },
        { id: 'spot_hidden', name: '侦查', baseValue: 25, currentValue: 50, category: 'common', description: '发现隐藏线索' },
        { id: 'first_aid', name: '急救', baseValue: 30, currentValue: 45, category: 'common', description: '基础医疗' },
      ],
    },
  },

  // === COC 模式角色（纯属性）===
  {
    id: 'soldier',
    name: '退伍军人',
    description: '经验丰富的战士，擅长战斗和生存',
    category: '战士',
    worldlineId: 'default',
    creationMode: 'coc',
    gender: 'male',
    characterAttributes: {
      basic: {
        strength: 80,  // 高力量
        constitution: 75,
        dexterity: 70,
        intelligence: 55,
        education: 50,
        power: 60,
        charisma: 50,
        luck: 45,
      },
      derived: {
        hitPoints: 78,
        sanity: 60,
        magicPoints: 12,
        movement: 9,
      },
      skills: [
        { id: 'firearms_handgun', name: '手枪', baseValue: 20, currentValue: 75, category: 'combat', description: '手枪射击' },
        { id: 'firearms_rifle', name: '步枪', baseValue: 25, currentValue: 70, category: 'combat', description: '步枪射击' },
        { id: 'fighting_brawl', name: '格斗', baseValue: 25, currentValue: 65, category: 'combat', description: '肉搏战斗' },
        { id: 'first_aid', name: '急救', baseValue: 30, currentValue: 60, category: 'common', description: '战地急救' },
        { id: 'survival', name: '生存', baseValue: 10, currentValue: 55, category: 'common', description: '野外生存' },
        { id: 'navigate', name: '导航', baseValue: 10, currentValue: 50, category: 'common', description: '辨别方向' },
      ],
    },
  },
  {
    id: 'doctor',
    name: '医生',
    description: '医术精湛的医师，救死扶伤',
    category: '学者',
    worldlineId: 'default',
    creationMode: 'coc',
    gender: 'female',
    characterAttributes: {
      basic: {
        strength: 50,
        constitution: 60,
        dexterity: 70,
        intelligence: 80,  // 高智力
        education: 85,  // 高教育
        power: 65,
        charisma: 60,
        luck: 50,
      },
      derived: {
        hitPoints: 55,
        sanity: 65,
        magicPoints: 13,
        movement: 8,
      },
      skills: [
        { id: 'medicine', name: '医学', baseValue: 1, currentValue: 80, category: 'knowledge', description: '医疗知识' },
        { id: 'first_aid', name: '急救', baseValue: 30, currentValue: 75, category: 'common', description: '紧急救治' },
        { id: 'biology', name: '生物学', baseValue: 1, currentValue: 65, category: 'knowledge', description: '生物知识' },
        { id: 'chemistry', name: '化学', baseValue: 1, currentValue: 60, category: 'knowledge', description: '化学知识' },
        { id: 'science', name: '科学', baseValue: 1, currentValue: 55, category: 'knowledge', description: '科学知识' },
        { id: 'persuade', name: '说服', baseValue: 10, currentValue: 50, category: 'social', description: '安抚病人' },
      ],
    },
  },
];

/**
 * 根据分类获取预设角色
 */
export function getPresetCharactersByCategory(category: string): PresetCharacterTemplate[] {
  if (category === 'all') {
    return PRESET_CHARACTERS;
  }
  return PRESET_CHARACTERS.filter(char => char.category === category);
}

/**
 * 根据ID获取预设角色
 */
export function getPresetCharacterById(id: string): PresetCharacterTemplate | undefined {
  return PRESET_CHARACTERS.find(char => char.id === id);
}

/**
 * 获取所有分类
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  PRESET_CHARACTERS.forEach(char => categories.add(char.category));
  return ['all', ...Array.from(categories)];
}
