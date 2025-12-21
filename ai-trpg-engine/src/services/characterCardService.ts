import type {
  Character,
  CharacterCardV2,
  CharacterCardV2Data,
  NarrativeDescription,
} from '../utils/types';

/**
 * Character Card V2 服务
 * 实现 SillyTavern 兼容的角色卡导入导出功能
 */

// ============ 转换函数 ============

/**
 * 将 Character 转换为 CharacterCardV2
 */
export function characterToCardV2(character: Character): CharacterCardV2 {
  // 优先使用 narrativeDescription，否则从其他字段构建
  const narrative = character.narrativeDescription || {} as NarrativeDescription;

  const data: CharacterCardV2Data = {
    // V1 基础字段
    name: character.name,
    description: narrative.description || character.story || '',
    personality: narrative.personality || '',
    scenario: narrative.scenario || `世界线: ${character.worldlineId}`,
    first_mes: narrative.firstMessage || '你好，很高兴认识你。',
    mes_example: narrative.exampleDialogs || '',

    // V2 扩展字段
    creator_notes: `创建于: ${character.createdAt}`,
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    tags: [],
    creator: 'AI-TRPG-Engine',
    character_version: '1.0',

    // 扩展数据（保存完整的 Character 数据）
    extensions: {
      ai_trpg_engine: {
        // 保存原始角色数据
        worldlineId: character.worldlineId,
        creationMode: character.creationMode,
        birthYear: character.birthYear,
        gender: character.gender,
        backgrounds: character.backgrounds,
        talents: character.talents,
        characterAttributes: character.characterAttributes,
        currentAge: character.currentAge,
        detailedProfile: character.detailedProfile,
      },
    },
  };

  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data,
  };
}

/**
 * 将 CharacterCardV2 转换为 Character
 */
export function cardV2ToCharacter(card: CharacterCardV2, worldlineId?: string): Character {
  const data = card.data;
  const extensions = data.extensions?.ai_trpg_engine || {};

  // 从 V2 数据构建 narrativeDescription
  const narrativeDescription: NarrativeDescription = {
    description: data.description,
    personality: data.personality,
    scenario: data.scenario,
    firstMessage: data.first_mes,
    exampleDialogs: data.mes_example,
  };

  // 构建 Character 对象
  const character: Character = {
    id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: data.name,
    worldlineId: extensions.worldlineId || worldlineId || 'unknown',
    createdAt: new Date().toISOString(),

    // 创建模式相关
    creationMode: extensions.creationMode || 'narrative',
    narrativeDescription,

    // 从扩展数据恢复
    birthYear: extensions.birthYear,
    gender: extensions.gender,
    backgrounds: extensions.backgrounds,
    talents: extensions.talents,
    characterAttributes: extensions.characterAttributes,
    currentAge: extensions.currentAge,
    detailedProfile: extensions.detailedProfile,

    // 保存原始 V2 数据
    characterCard: data,
  };

  return character;
}

// ============ 导出功能 ============

/**
 * 导出角色为 JSON 文件
 */
export function exportCharacterAsJSON(character: Character): string {
  const card = characterToCardV2(character);
  return JSON.stringify(card, null, 2);
}

/**
 * 导出角色为 V2 格式的 Blob（用于下载）
 */
export function exportCharacterAsBlob(character: Character): Blob {
  const json = exportCharacterAsJSON(character);
  return new Blob([json], { type: 'application/json' });
}

/**
 * 触发下载 Character Card JSON 文件
 */
export function downloadCharacterCard(character: Character): void {
  const blob = exportCharacterAsBlob(character);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============ 导入功能 ============

/**
 * 从 JSON 字符串导入角色
 */
export function importCharacterFromJSON(json: string, defaultWorldlineId?: string): Character {
  try {
    const parsed = JSON.parse(json);

    // 验证是否为 V2 格式
    if (parsed.spec !== 'chara_card_v2') {
      throw new Error('不是有效的 Character Card V2 格式');
    }

    return cardV2ToCharacter(parsed as CharacterCardV2, defaultWorldlineId);
  } catch (error) {
    throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 从 File 对象导入角色
 */
export async function importCharacterFromFile(
  file: File,
  defaultWorldlineId?: string
): Promise<Character> {
  // 检查文件类型
  if (file.type === 'application/json' || file.name.endsWith('.json')) {
    // JSON 文件
    const text = await file.text();
    return importCharacterFromJSON(text, defaultWorldlineId);
  } else if (file.type.startsWith('image/png') || file.name.endsWith('.png')) {
    // PNG 文件（从元数据提取）
    return importCharacterFromPNG(file, defaultWorldlineId);
  } else {
    throw new Error('不支持的文件类型，请使用 .json 或 .png 文件');
  }
}

// ============ PNG 元数据功能 ============

/**
 * 将 Character Card 嵌入到 PNG 图片中
 * 使用 tEXt chunk 存储 JSON 数据（SillyTavern 标准）
 */
export async function embedCardInPNG(
  imageFile: File,
  character: Character
): Promise<Blob> {
  const card = characterToCardV2(character);
  const cardJSON = JSON.stringify(card);

  // 读取图片数据
  const arrayBuffer = await imageFile.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // 验证 PNG 签名
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (uint8Array[i] !== pngSignature[i]) {
      throw new Error('不是有效的 PNG 文件');
    }
  }

  // 创建 tEXt chunk
  const keyword = 'chara'; // SillyTavern 使用的关键字
  const text = cardJSON;

  // 编码文本数据
  const keywordBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(text);

  // 计算 chunk 长度（关键字 + null 分隔符 + 文本）
  const chunkLength = keywordBytes.length + 1 + textBytes.length;

  // 创建 chunk 数据
  const chunkData = new Uint8Array(chunkLength);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0; // null 分隔符
  chunkData.set(textBytes, keywordBytes.length + 1);

  // 创建完整的 tEXt chunk
  const chunk = createPNGChunk('tEXt', chunkData);

  // 找到 IEND chunk 的位置（PNG 文件末尾前）
  let iendPosition = uint8Array.length - 12; // IEND chunk 总是 12 字节

  // 验证 IEND
  const iendSignature = [0x49, 0x45, 0x4e, 0x44]; // "IEND"
  let foundIEND = true;
  for (let i = 0; i < 4; i++) {
    if (uint8Array[iendPosition + 4 + i] !== iendSignature[i]) {
      foundIEND = false;
      break;
    }
  }

  if (!foundIEND) {
    throw new Error('无法找到 PNG IEND chunk');
  }

  // 组合新的 PNG：原始数据（到 IEND 之前） + tEXt chunk + IEND chunk
  const newPNG = new Uint8Array(iendPosition + chunk.length + 12);
  newPNG.set(uint8Array.slice(0, iendPosition), 0);
  newPNG.set(chunk, iendPosition);
  newPNG.set(uint8Array.slice(iendPosition), iendPosition + chunk.length);

  return new Blob([newPNG], { type: 'image/png' });
}

/**
 * 从 PNG 图片中提取 Character Card
 */
export async function importCharacterFromPNG(
  file: File,
  defaultWorldlineId?: string
): Promise<Character> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // 验证 PNG 签名
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (uint8Array[i] !== pngSignature[i]) {
      throw new Error('不是有效的 PNG 文件');
    }
  }

  // 查找 tEXt chunk（关键字为 "chara"）
  let position = 8; // 跳过 PNG 签名

  while (position < uint8Array.length) {
    // 读取 chunk 长度
    const length = (uint8Array[position] << 24) |
                   (uint8Array[position + 1] << 16) |
                   (uint8Array[position + 2] << 8) |
                   uint8Array[position + 3];

    // 读取 chunk 类型
    const type = String.fromCharCode(
      uint8Array[position + 4],
      uint8Array[position + 5],
      uint8Array[position + 6],
      uint8Array[position + 7]
    );

    // 如果是 tEXt chunk
    if (type === 'tEXt') {
      const dataStart = position + 8;
      const dataEnd = dataStart + length;
      const chunkData = uint8Array.slice(dataStart, dataEnd);

      // 查找 null 分隔符
      let nullIndex = 0;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullIndex = i;
          break;
        }
      }

      // 提取关键字和文本
      const keyword = new TextDecoder().decode(chunkData.slice(0, nullIndex));

      if (keyword === 'chara') {
        const text = new TextDecoder().decode(chunkData.slice(nullIndex + 1));
        return importCharacterFromJSON(text, defaultWorldlineId);
      }
    }

    // 如果是 IEND，结束
    if (type === 'IEND') {
      break;
    }

    // 移动到下一个 chunk（长度 + 类型 + 数据 + CRC）
    position += 12 + length;
  }

  throw new Error('PNG 文件中没有找到角色卡数据');
}

/**
 * 下载带有嵌入数据的 PNG
 */
export async function downloadCharacterCardPNG(
  imageFile: File,
  character: Character
): Promise<void> {
  const blob = await embedCardInPNG(imageFile, character);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============ 辅助函数 ============

/**
 * 创建 PNG chunk
 */
function createPNGChunk(type: string, data: Uint8Array): Uint8Array {
  const length = data.length;
  const chunk = new Uint8Array(12 + length);

  // 写入长度（大端序）
  chunk[0] = (length >> 24) & 0xff;
  chunk[1] = (length >> 16) & 0xff;
  chunk[2] = (length >> 8) & 0xff;
  chunk[3] = length & 0xff;

  // 写入类型
  const typeBytes = new TextEncoder().encode(type);
  chunk.set(typeBytes, 4);

  // 写入数据
  chunk.set(data, 8);

  // 计算 CRC（类型 + 数据）
  const crcData = new Uint8Array(4 + length);
  crcData.set(typeBytes, 0);
  crcData.set(data, 4);
  const crc = calculateCRC(crcData);

  // 写入 CRC（大端序）
  chunk[8 + length] = (crc >> 24) & 0xff;
  chunk[8 + length + 1] = (crc >> 16) & 0xff;
  chunk[8 + length + 2] = (crc >> 8) & 0xff;
  chunk[8 + length + 3] = crc & 0xff;

  return chunk;
}

/**
 * 计算 CRC32 校验和
 */
function calculateCRC(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
