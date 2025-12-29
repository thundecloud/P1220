import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import WorldlineManager from '../components/worldline/WorldlineManager';
import worldlinesData from '../data/worldlines.json';
import talentsData from '../data/talents.json';
import backgroundsData from '../data/backgrounds.json';
import { PRESET_CHARACTERS } from '../data/presetCharacters';
import {
  generateCharacterAttributes,
  rerollBasicAttributes,
  calculateDerivedAttributes,
  drawTalents,
  groupTalents,
  rerollTalentGroup,
  createCharacter,
  calculateAttributeSum,
  getAttributeLevel,
} from '../services/characterService';
import {
  listWorldlines,
  loadWorldline,
  saveWorldline,
  deleteWorldline,
} from '../utils/tauri';
import type {
  Worldline,
  Talent,
  Background,
  CharacterAttributes,
  BasicAttributes,
  CharacterCreationMode,
  NarrativeDescription,
  DetailedProfile,
} from '../utils/types';
import { RARITY_LABELS, RARITY_COLORS } from '../utils/types';
import CreationModeSelector from '../components/character/CreationModeSelector';
import NarrativeDescriptionEditor from '../components/character/NarrativeDescriptionEditor';
import DetailedProfileEditor from '../components/character/DetailedProfileEditor';
import AvatarUpload from '../components/character/AvatarUpload';

type Step = 'worldline' | 'character';

export default function CharacterCreation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useCharacterStore();
  const quickStartProcessed = useRef(false);

  // 步骤控制
  const [step, setStep] = useState<Step>('worldline');

  // 世界线数据
  const [builtInWorldlines] = useState<Worldline[]>(worldlinesData as Worldline[]);
  const [customWorldlines, setCustomWorldlines] = useState<Worldline[]>([]);
  const [allWorldlines, setAllWorldlines] = useState<Worldline[]>([]);
  const [selectedWorldline, setSelectedWorldline] = useState<Worldline | null>(null);

  // 创建模式
  const [creationMode, setCreationMode] = useState<CharacterCreationMode>('narrative');

  // 叙事描述（narrative/hybrid 模式）
  const [narrativeDescription, setNarrativeDescription] = useState<NarrativeDescription>({
    description: '',
    personality: '',
    scenario: '',
    firstMessage: '',
    exampleDialogs: '',
    likes: '',
    dislikes: '',
    background: '',
    speech: '',
    thinking: '',
  });

  // 详细履历（可选）
  const [detailedProfile, setDetailedProfile] = useState<DetailedProfile>({});

  // 角色头像（可选）
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // 角色数据（COC 模式）
  const [characterAttributes, setCharacterAttributes] = useState<CharacterAttributes | null>(null);
  const [characterAge, setCharacterAge] = useState(20);
  const [characterName, setCharacterName] = useState('');
  const [characterGender, setCharacterGender] = useState<'male' | 'female' | 'other'>('male');
  const [characterStory, setCharacterStory] = useState('');

  // 天赋数据
  const [talents] = useState<Talent[]>(talentsData as Talent[]);
  const [talentGroups, setTalentGroups] = useState<Talent[][]>([]);
  const [selectedTalents, setSelectedTalents] = useState<Talent[]>([]);
  const [rerollCounts, setRerollCounts] = useState<number[]>([0, 0, 0]);

  // 背景数据
  const [backgrounds] = useState<Background[]>(backgroundsData as Background[]);
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);

  // UI状态
  const [showWorldlineManager, setShowWorldlineManager] = useState(false);
  const [expandedWorldlineId, setExpandedWorldlineId] = useState<string | null>(null);

  // 加载自定义世界线
  useEffect(() => {
    loadCustomWorldlines();
  }, []);

  // 合并内置和自定义世界线
  useEffect(() => {
    setAllWorldlines([...builtInWorldlines, ...customWorldlines]);
  }, [builtInWorldlines, customWorldlines]);

  // 快速开始模式处理
  useEffect(() => {
    const isQuickStart = searchParams.get('quickstart') === 'true';
    if (isQuickStart && !quickStartProcessed.current && builtInWorldlines.length > 0) {
      quickStartProcessed.current = true;

      // 获取第一个预设角色
      const presetCharacter = PRESET_CHARACTERS[0];
      if (!presetCharacter) return;

      // 找到对应的世界线（使用默认世界线）
      const targetWorldline = builtInWorldlines.find(w => w.id === presetCharacter.worldlineId)
        || builtInWorldlines[0];

      if (!targetWorldline) return;

      // 创建角色并直接进入游戏
      const character = createCharacter(
        presetCharacter.name,
        presetCharacter.gender,
        targetWorldline.id,
        targetWorldline,
        [],  // 无背景
        [],  // 无天赋（narrative模式）
        null,  // 无COC属性
        25,  // 默认年龄
        '',  // 无故事
        presetCharacter.creationMode,
        presetCharacter.narrativeDescription || {
          description: '',
          personality: '',
          scenario: '',
        },
        {},  // 无详细履历
        ''   // 无头像
      );

      store.setCharacter(character);
      store.setSelectedWorldline(targetWorldline);
      localStorage.setItem('currentCharacter', JSON.stringify(character));

      // 直接跳转到游戏
      navigate('/game', { state: { character }, replace: true });
    }
  }, [searchParams, builtInWorldlines, navigate, store]);

  const loadCustomWorldlines = async () => {
    try {
      const filenames = await listWorldlines();
      const loaded: Worldline[] = [];

      for (const filename of filenames) {
        try {
          const data = await loadWorldline(filename);
          const worldline = JSON.parse(data) as Worldline;
          loaded.push(worldline);
        } catch (error) {
          console.error(`Failed to load worldline ${filename}:`, error);
        }
      }

      setCustomWorldlines(loaded);
    } catch (error) {
      console.error('Failed to list worldlines:', error);
    }
  };

  // ============ 世界线管理 ============

  const handleWorldlineCreated = async (worldline: Worldline) => {
    try {
      const filename = `${worldline.id}.json`;
      await saveWorldline(filename, JSON.stringify(worldline, null, 2));
      setCustomWorldlines(prev => [...prev, worldline]);
      alert('世界线创建成功！');
    } catch (error) {
      console.error('Failed to save worldline:', error);
      alert('保存失败');
    }
  };

  const handleWorldlineUpdated = async (worldline: Worldline) => {
    try {
      const filename = `${worldline.id}.json`;
      await saveWorldline(filename, JSON.stringify(worldline, null, 2));
      setCustomWorldlines(prev => prev.map(w => w.id === worldline.id ? worldline : w));
      alert('世界线更新成功！');
    } catch (error) {
      console.error('Failed to update worldline:', error);
      alert('更新失败');
    }
  };

  const handleWorldlineDeleted = async (worldlineId: string) => {
    try {
      const filename = `${worldlineId}.json`;
      await deleteWorldline(filename);
      setCustomWorldlines(prev => prev.filter(w => w.id !== worldlineId));
      alert('世界线删除成功！');
    } catch (error) {
      console.error('Failed to delete worldline:', error);
      alert('删除失败');
    }
  };

  // ============ 世界线选择 ============

  const handleWorldlineSelect = (worldline: Worldline) => {
    setSelectedWorldline(worldline);
    store.setSelectedWorldline(worldline);

    // 生成角色属性
    const attrs = generateCharacterAttributes(worldline, characterAge);
    setCharacterAttributes(attrs);

    // 抽取天赋
    const drawnTalents = drawTalents(talents, worldline.talentPoolIds, 9);
    const grouped = groupTalents(drawnTalents);
    setTalentGroups(grouped);
    setSelectedTalents([]);
    setRerollCounts([0, 0, 0]);

    setStep('character');
  };

  const toggleWorldlineExpand = (worldlineId: string) => {
    setExpandedWorldlineId(expandedWorldlineId === worldlineId ? null : worldlineId);
  };

  // ============ 属性重roll ============

  const handleRerollAttributes = () => {
    if (!selectedWorldline || !characterAttributes) return;

    const newBasic = rerollBasicAttributes(selectedWorldline);
    const newDerived = calculateDerivedAttributes(newBasic, characterAge);

    setCharacterAttributes({
      basic: newBasic,
      derived: newDerived,
      skills: characterAttributes.skills,
    });
  };

  // ============ 年龄变更 ============

  const handleAgeChange = (newAge: number) => {
    setCharacterAge(newAge);

    if (characterAttributes) {
      const newDerived = calculateDerivedAttributes(characterAttributes.basic, newAge);
      setCharacterAttributes({
        ...characterAttributes,
        derived: newDerived,
      });
    }
  };

  // ============ 天赋选择 ============

  const handleTalentSelect = (groupIndex: number, talent: Talent) => {
    const newSelected = [...selectedTalents];

    // 移除该组之前的选择
    const existingIndex = newSelected.findIndex((t) =>
      talentGroups[groupIndex].some((gt) => gt.id === t.id)
    );

    if (existingIndex !== -1) {
      newSelected.splice(existingIndex, 1);
    }

    // 添加新选择
    newSelected.push(talent);
    setSelectedTalents(newSelected);
  };

  const handleRerollTalentGroup = (groupIndex: number) => {
    if (!selectedWorldline) return;

    const excludedTalents = [
      ...talentGroups.flat().filter((_, i) => Math.floor(i / 3) !== groupIndex),
    ];

    try {
      const newGroup = rerollTalentGroup(talents, selectedWorldline.talentPoolIds, excludedTalents);
      const newGroups = [...talentGroups];
      newGroups[groupIndex] = newGroup;
      setTalentGroups(newGroups);

      // 清除该组的选择
      setSelectedTalents(selectedTalents.filter((t) => !newGroup.some((ng) => ng.id === t.id)));

      // 增加重roll计数
      const newCounts = [...rerollCounts];
      newCounts[groupIndex]++;
      setRerollCounts(newCounts);
    } catch (error) {
      console.error('Failed to reroll talent group:', error);
      alert('重新抽取失败: ' + (error as Error).message);
    }
  };

  // ============ 背景选择 ============

  const toggleBackground = (bgId: string) => {
    if (selectedBackgrounds.includes(bgId)) {
      setSelectedBackgrounds(selectedBackgrounds.filter((id) => id !== bgId));
    } else {
      setSelectedBackgrounds([...selectedBackgrounds, bgId]);
    }
  };

  // ============ 创建角色 ============

  const handleCreateCharacter = () => {
    // 验证逻辑根据创建模式不同而不同
    if (!selectedWorldline || !characterName.trim()) {
      alert('请完成所有必填项');
      return;
    }

    // narrative 模式验证
    if (creationMode === 'narrative') {
      if (!narrativeDescription.description || !narrativeDescription.personality || !narrativeDescription.scenario) {
        alert('叙事模式需要填写角色描述、性格和场景');
        return;
      }
    }

    // coc/hybrid 模式验证
    if (creationMode === 'coc' || creationMode === 'hybrid') {
      if (!characterAttributes || selectedTalents.length !== 3) {
        alert('COC模式需要生成属性并选择3个天赋');
        return;
      }
    }

    const character = createCharacter(
      characterName,
      characterGender,
      selectedWorldline.id,
      selectedWorldline,
      selectedBackgrounds,
      selectedTalents,
      characterAttributes,
      characterAge,
      characterStory,
      creationMode,
      narrativeDescription,
      detailedProfile,
      avatarUrl
    );

    store.setCharacter(character);
    // 保存到localStorage以便刷新后恢复
    localStorage.setItem('currentCharacter', JSON.stringify(character));
    // 通过state传递角色数据到游戏页面
    navigate('/game', { state: { character } });
  };

  // ============ 返回世界线选择 ============

  const handleBackToWorldline = () => {
    setStep('worldline');
    setSelectedWorldline(null);
    setCharacterAttributes(null);
    setTalentGroups([]);
    setSelectedTalents([]);
  };

  // ============ UI 辅助函数 ============

  const getAvailableBackgrounds = () => {
    if (!selectedWorldline) return [];
    return backgrounds.filter((bg) => bg.worldlines.includes(selectedWorldline.id));
  };

  const getAttributeLabel = (key: keyof BasicAttributes): string => {
    const labels: Record<keyof BasicAttributes, string> = {
      strength: '力量 STR',
      constitution: '体质 CON',
      dexterity: '敏捷 DEX',
      intelligence: '智力 INT',
      education: '教育 EDU',
      power: '意志 POW',
      charisma: '魅力 CHA',
      luck: '幸运 LUC',
    };
    return labels[key];
  };

  // ============ 渲染 ============

  return (
    <div className="min-h-screen p-8 grid-bg">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-none p-6 border-4 border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="led"></div>
              <div>
                <h1 className="text-4xl font-bold">NEW LIFE.EXE</h1>
                <div className="label mt-1">Character Creation Protocol v2.0</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-none"
            >
              ◀ 中止
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center justify-center gap-8 font-mono text-sm">
            <div
              className={`flex items-center gap-2 ${
                step === 'worldline' ? 'terminal-text' : 'text-muted-foreground'
              }`}
            >
              <span className="text-2xl">{step === 'worldline' ? '►' : '□'}</span>
              <span>STEP 1: 世界线选择</span>
            </div>
            <div className="text-muted-foreground">→</div>
            <div
              className={`flex items-center gap-2 ${
                step === 'character' ? 'terminal-text' : 'text-muted-foreground'
              }`}
            >
              <span className="text-2xl">{step === 'character' ? '►' : '□'}</span>
              <span>STEP 2: 角色塑造</span>
            </div>
          </div>
        </div>

        {/* Worldline Selection */}
        {step === 'worldline' && (
          <div className="space-y-6">
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="led indicator"></div>
                  <h2 className="text-2xl font-bold">选择历史时空</h2>
                </div>
                <button
                  onClick={() => setShowWorldlineManager(!showWorldlineManager)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-none"
                >
                  {showWorldlineManager ? '隐藏' : '管理'} 自定义世界线
                </button>
              </div>

              <p className="text-sm text-muted-foreground font-mono mb-6">
                &gt; 你将在哪个历史时空中展开人生？每个世界线都有独特的挑战与机遇
              </p>
            </div>

            {/* 世界线管理器 */}
            {showWorldlineManager && (
              <WorldlineManager
                customWorldlines={customWorldlines}
                onWorldlineCreated={handleWorldlineCreated}
                onWorldlineUpdated={handleWorldlineUpdated}
                onWorldlineDeleted={handleWorldlineDeleted}
                onClose={() => setShowWorldlineManager(false)}
              />
            )}

            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allWorldlines.map((wl) => (
                  <div
                    key={wl.id}
                    className="bg-background border-4 border-border rounded-none overflow-hidden transition-all hover:border-primary group"
                  >
                    {/* 世界线卡片头部 */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleWorldlineExpand(wl.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="label text-xs">{wl.era}</div>
                        {wl.isCustom && (
                          <span className="label text-xs bg-accent text-accent-foreground px-2 py-1">
                            自定义
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold mb-2 group-hover:terminal-text transition-colors">
                        {wl.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono line-clamp-2 mb-3">
                        {wl.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {wl.culture.slice(0, 2).map((c) => (
                          <span key={c} className="label text-xs px-2 py-1 bg-muted">
                            {c}
                          </span>
                        ))}
                        {wl.culture.length > 2 && (
                          <span className="label text-xs px-2 py-1 bg-muted">
                            +{wl.culture.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 展开详情 */}
                    {expandedWorldlineId === wl.id && (
                      <div className="px-4 pb-4 border-t-2 border-border">
                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="label text-xs mb-1">历史背景:</div>
                            <p className="text-xs text-muted-foreground font-mono">
                              {wl.historicalBackground}
                            </p>
                          </div>

                          {wl.special.challenges && wl.special.challenges.length > 0 && (
                            <div>
                              <div className="label text-xs mb-1">挑战:</div>
                              <ul className="text-xs text-muted-foreground font-mono space-y-1">
                                {wl.special.challenges.slice(0, 2).map((c, i) => (
                                  <li key={i}>• {c}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {wl.special.opportunities && wl.special.opportunities.length > 0 && (
                            <div>
                              <div className="label text-xs mb-1">机遇:</div>
                              <ul className="text-xs text-muted-foreground font-mono space-y-1">
                                {wl.special.opportunities.slice(0, 2).map((o, i) => (
                                  <li key={i}>• {o}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 选择按钮 */}
                    <div className="p-4 bg-muted">
                      <button
                        onClick={() => handleWorldlineSelect(wl)}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-none font-bold"
                      >
                        选择此世界线
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {allWorldlines.length === 0 && (
                <div className="text-center py-12 text-muted-foreground font-mono">
                  <p>&gt; 没有可用的世界线</p>
                  <p className="text-xs mt-2">请检查数据文件或创建自定义世界线</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Character Creation */}
        {step === 'character' && selectedWorldline && (
          <div className="space-y-6">
            {/* 世界线信息 */}
            <div className="bg-card rounded-none p-4 border-4 border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <div className="label text-xs">{selectedWorldline.era}</div>
                  <h3 className="text-xl font-bold terminal-text">{selectedWorldline.name}</h3>
                </div>
                <button
                  onClick={handleBackToWorldline}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-none text-sm"
                >
                  ← 更换世界线
                </button>
              </div>
            </div>

            {/* 创建模式选择 */}
            <CreationModeSelector mode={creationMode} onChange={setCreationMode} />

            {/* 角色头像上传 */}
            <AvatarUpload avatarUrl={avatarUrl} onAvatarChange={setAvatarUrl} />

            {/* 叙事模式表单 */}
            {(creationMode === 'narrative' || creationMode === 'hybrid') && (
              <NarrativeDescriptionEditor
                description={narrativeDescription}
                onChange={setNarrativeDescription}
              />
            )}

            {/* COC 模式表单 */}
            {(creationMode === 'coc' || creationMode === 'hybrid') && characterAttributes && (
              <>
            {/* 基础信息 */}
            <div className="bg-card rounded-none p-6 border-4 border-border space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
                <h2 className="text-2xl font-bold">基础信息</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label block mb-2">角色姓名 *</label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="输入角色姓名..."
                    className="w-full px-4 py-3 rounded-none font-mono"
                  />
                </div>

                <div>
                  <label className="label block mb-2">年龄 *</label>
                  <input
                    type="number"
                    min="15"
                    max="90"
                    value={characterAge}
                    onChange={(e) => handleAgeChange(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">年龄会影响派生属性</p>
                </div>
              </div>

              <div>
                <label className="label block mb-2">性别 *</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'male' as const, label: '男性' },
                    { value: 'female' as const, label: '女性' },
                    { value: 'other' as const, label: '其他' },
                  ].map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setCharacterGender(g.value)}
                      className={`py-3 border-2 rounded-none ${
                        characterGender === g.value
                          ? 'border-primary bg-primary bg-opacity-20'
                          : 'border-border'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 属性值 */}
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="led" style={{ background: 'var(--color-neon-orange)' }}></div>
                  <h2 className="text-2xl font-bold">角色属性</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-mono">
                    <span className="label">总和:</span>
                    <span className="terminal-text text-xl ml-2">
                      {calculateAttributeSum(characterAttributes.basic)}
                    </span>
                  </div>
                  <button
                    onClick={handleRerollAttributes}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-none"
                  >
                    🎲 重新投骰
                  </button>
                </div>
              </div>

              {/* 基础属性 */}
              <div className="mb-6">
                <div className="label mb-3">基础属性 (0-100):</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(Object.keys(characterAttributes.basic) as Array<keyof BasicAttributes>).map(
                    (key) => (
                      <div key={key} className="bg-background border-2 border-border p-4 rounded-none">
                        <div className="label text-xs mb-2">{getAttributeLabel(key)}</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold terminal-text font-mono">
                            {characterAttributes.basic[key]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {getAttributeLevel(characterAttributes.basic[key])}
                          </span>
                        </div>
                        <div className="mt-2 bg-muted h-2 rounded-none overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all"
                            style={{ width: `${characterAttributes.basic[key]}%` }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 派生属性 */}
              <div>
                <div className="label mb-3">派生属性:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background border-2 border-accent p-4 rounded-none">
                    <div className="label text-xs mb-1">生命值 HP</div>
                    <div className="text-2xl font-bold terminal-text">
                      {characterAttributes.derived.hitPoints}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      (CON+STR)/10
                    </div>
                  </div>
                  <div className="bg-background border-2 border-accent p-4 rounded-none">
                    <div className="label text-xs mb-1">理智值 SAN</div>
                    <div className="text-2xl font-bold terminal-text">
                      {characterAttributes.derived.sanity}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">= POW</div>
                  </div>
                  <div className="bg-background border-2 border-accent p-4 rounded-none">
                    <div className="label text-xs mb-1">魔力值 MP</div>
                    <div className="text-2xl font-bold terminal-text">
                      {characterAttributes.derived.magicPoints}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">POW/5</div>
                  </div>
                  <div className="bg-background border-2 border-accent p-4 rounded-none">
                    <div className="label text-xs mb-1">移动力 MOV</div>
                    <div className="text-2xl font-bold terminal-text">
                      {characterAttributes.derived.movement}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">基于年龄</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 天赋选择 */}
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="led" style={{ background: 'var(--color-neon-magenta)' }}></div>
                <h2 className="text-2xl font-bold">
                  天赋选择 ({selectedTalents.length}/3)
                </h2>
              </div>
              <p className="text-sm text-muted-foreground font-mono mb-6">
                &gt; 从每组中选择一个天赋。天赋会影响AI的叙事风格。
              </p>

              <div className="space-y-6">
                {talentGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="bg-background border-2 border-border p-4 rounded-none">
                    <div className="flex items-center justify-between mb-4">
                      <div className="label">第 {groupIndex + 1} 组 - 选择一个:</div>
                      <button
                        onClick={() => handleRerollTalentGroup(groupIndex)}
                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded-none text-sm"
                      >
                        🎲 重roll ({rerollCounts[groupIndex]})
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {group.map((talent) => {
                        const isSelected = selectedTalents.some((t) => t.id === talent.id);
                        return (
                          <button
                            key={talent.id}
                            onClick={() => handleTalentSelect(groupIndex, talent)}
                            className={`text-left p-4 border-2 rounded-none transition-all ${
                              isSelected
                                ? 'border-primary bg-primary bg-opacity-20'
                                : 'border-border hover:border-accent'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-2xl">{talent.icon}</span>
                              <span className={`label text-xs ${RARITY_COLORS[talent.rarity]}`}>
                                {RARITY_LABELS[talent.rarity]}
                              </span>
                            </div>
                            <h4 className="font-bold mb-2">{talent.name}</h4>
                            <p className="text-xs text-muted-foreground font-mono line-clamp-2">
                              {talent.description}
                            </p>
                            {isSelected && (
                              <div className="mt-2 terminal-text text-xs">✓ 已选择</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 背景选择 */}
            {getAvailableBackgrounds().length > 0 && (
              <div className="bg-card rounded-none p-6 border-4 border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="led" style={{ background: 'var(--color-terminal-amber)' }}></div>
                  <h2 className="text-2xl font-bold">背景身份 (可选)</h2>
                </div>
                <p className="text-sm text-muted-foreground font-mono mb-4">
                  &gt; 选择角色的社会背景或身份（可多选）
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {getAvailableBackgrounds().map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => toggleBackground(bg.id)}
                      className={`text-left p-3 border-2 rounded-none text-sm transition-all ${
                        selectedBackgrounds.includes(bg.id)
                          ? 'border-accent bg-accent bg-opacity-20'
                          : 'border-border hover:border-muted'
                      }`}
                    >
                      <div className="font-bold mb-1">{bg.name}</div>
                      <div className="text-xs text-muted-foreground font-mono line-clamp-2">
                        {bg.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 角色故事（COC模式）*/}
            <div className="bg-card rounded-none p-6 border-4 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="led indicator"></div>
                <h2 className="text-2xl font-bold">角色故事 (可选)</h2>
              </div>
              <textarea
                value={characterStory}
                onChange={(e) => setCharacterStory(e.target.value)}
                placeholder="描述你的角色背景故事、性格特点、动机目标..."
                className="w-full px-4 py-3 rounded-none font-mono text-sm min-h-[120px] resize-y"
              />
            </div>

            {/* 详细履历（可选）*/}
            <DetailedProfileEditor
              profile={detailedProfile}
              onChange={setDetailedProfile}
            />
            </>
            )}

            {/* 创建按钮（所有模式）*/}
            <div className="bg-card rounded-none p-6 border-4 border-primary">
              <button
                onClick={handleCreateCharacter}
                disabled={
                  !characterName.trim() ||
                  (creationMode === 'narrative' && (!narrativeDescription.description || !narrativeDescription.personality || !narrativeDescription.scenario)) ||
                  ((creationMode === 'coc' || creationMode === 'hybrid') && selectedTalents.length !== 3)
                }
                className="w-full py-4 bg-primary text-primary-foreground rounded-none disabled:opacity-50 flex items-center justify-center gap-3 text-xl font-bold"
              >
                <span>✓</span>
                开始新人生
              </button>
              <div className="text-center text-sm text-muted-foreground mt-3 font-mono">
                {!characterName.trim() && <p>&gt; 请输入角色姓名</p>}
                {creationMode === 'narrative' && (!narrativeDescription.description || !narrativeDescription.personality || !narrativeDescription.scenario) && (
                  <p>&gt; 请完成角色描述、性格、场景三项必填字段</p>
                )}
                {(creationMode === 'coc' || creationMode === 'hybrid') && selectedTalents.length !== 3 && (
                  <p>&gt; 请从每组选择一个天赋</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="label">NEW LIFE.EXE v2.0 | Cassette Futurism Edition</span>
            <span className="terminal-text flex items-center gap-2">
              <div className="led" style={{ width: '8px', height: '8px' }}></div>
              [ READY ]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
