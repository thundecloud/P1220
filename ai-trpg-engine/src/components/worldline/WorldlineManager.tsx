import { useState } from 'react';
import type { Worldline, SettingDocument } from '../../utils/types';
import { LorebookService } from '../../services/lorebookService';

interface WorldlineManagerProps {
  customWorldlines: Worldline[];
  onWorldlineCreated: (worldline: Worldline) => void;
  onWorldlineUpdated: (worldline: Worldline) => void;
  onWorldlineDeleted: (worldlineId: string) => void;
  onClose: () => void;
}

export default function WorldlineManager({
  customWorldlines,
  onWorldlineCreated,
  onWorldlineUpdated: _onWorldlineUpdated,
  onWorldlineDeleted,
  onClose
}: WorldlineManagerProps) {
  const [selectedWorldline, setSelectedWorldline] = useState<Worldline | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');

  // 新建世界线表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    era: '',
    region: '',
    culture: [] as string[],
    historicalBackground: '',
  });

  // 设定文档导入
  const [settingText, setSettingText] = useState('');
  const [settingFormat, setSettingFormat] = useState<'markdown' | 'plaintext'>('plaintext');
  const [autoGenerateLorebook, setAutoGenerateLorebook] = useState(true);

  const handleCreateWorldline = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      era: '',
      region: '',
      culture: [],
      historicalBackground: '',
    });
    setSettingText('');
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setSettingText(text);

      // 检测文件格式
      if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        setSettingFormat('markdown');
      } else {
        setSettingFormat('plaintext');
      }

      // 自动填充一些基础信息
      if (!formData.name) {
        const baseName = file.name.replace(/\.(txt|md|markdown)$/i, '');
        setFormData(prev => ({ ...prev, name: baseName }));
      }
    } catch (error) {
      console.error('Failed to read file:', error);
      alert('文件读取失败');
    }
  };

  const handleSaveWorldline = () => {
    if (!formData.name.trim()) {
      alert('请输入世界线名称');
      return;
    }

    // 创建设定文档
    const settingDocument: SettingDocument | undefined = settingText.trim() ? {
      title: formData.name,
      content: settingText,
      format: settingFormat,
      category: '世界设定',
      tags: formData.culture,
      lastModified: new Date().toISOString()
    } : undefined;

    // 如果启用自动生成Lorebook，将大型设定拆分为条目
    let lorebook: import('../../utils/types').Lorebook | undefined = undefined;
    if (settingDocument && autoGenerateLorebook) {
      lorebook = LorebookService.createDefaultLorebook(
        `lorebook_${Date.now()}`,
        `${formData.name} - 知识库`
      );

      // 简单的自动拆分逻辑：按段落分割
      const paragraphs = settingText.split('\n\n').filter(p => p.trim());

      paragraphs.slice(0, 50).forEach((para, index) => {
        if (para.length > 50) { // 只处理有意义的段落
          // 提取可能的关键词（简单实现：取前几个词）
          const words = para.split(/[\s,，。.!！?？]+/).filter(w => w.length > 1);
          const keys = words.slice(0, 3);

          if (keys.length > 0 && lorebook) {
            const entry = LorebookService.createEntry(
              `设定片段 ${index + 1}`,
              keys,
              para.substring(0, 500) // 限制长度
            );
            entry.insertionOrder = 100 + index;
            lorebook.entries.push(entry);
          }
        }
      });
    }

    const newWorldline: Worldline = {
      id: `custom_${Date.now()}`,
      name: formData.name,
      description: formData.description || '自定义世界线',
      era: formData.era || '未知时代',
      region: formData.region || '未知地区',
      culture: formData.culture,
      historicalBackground: formData.historicalBackground || '无',
      special: {
        challenges: [],
        opportunities: []
      },
      // 默认属性参数（正态分布）
      attributeParams: {
        strength: { mu: 50, sigma: 15 },
        constitution: { mu: 50, sigma: 15 },
        dexterity: { mu: 50, sigma: 15 },
        intelligence: { mu: 50, sigma: 15 },
        education: { mu: 50, sigma: 15 },
        power: { mu: 50, sigma: 15 },
        charisma: { mu: 50, sigma: 15 },
        luck: { mu: 50, sigma: 15 },
      },
      talentPoolIds: ['common'],
      skillPoolIds: ['common'],
      lorebook,
      settingDocument,
      settingSize: settingText.length,
      settingAutoSplit: autoGenerateLorebook,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: '用户',
      version: '1.0'
    };

    onWorldlineCreated(newWorldline);
    setIsCreating(false);
    setFormData({
      name: '',
      description: '',
      era: '',
      region: '',
      culture: [],
      historicalBackground: '',
    });
    setSettingText('');
  };

  const handleDeleteWorldline = (worldlineId: string) => {
    if (!confirm('确定要删除这个世界线吗？')) return;
    onWorldlineDeleted(worldlineId);
  };

  return (
    <div className="panel-raised p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl">自定义世界线管理</h3>
        <button onClick={onClose} className="px-4 py-2 bg-secondary">
          关闭
        </button>
      </div>

      {/* 世界线列表 */}
      {!isCreating && !selectedWorldline && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="label">已创建 {customWorldlines.length} 个自定义世界线</p>
            <button
              onClick={handleCreateWorldline}
              className="px-6 py-2 bg-primary text-primary-foreground"
            >
              + 创建新世界线
            </button>
          </div>

          {customWorldlines.length === 0 ? (
            <div className="panel-recessed p-8 text-center text-muted-foreground">
              <p>还没有自定义世界线</p>
              <p className="text-xs mt-2">点击"创建新世界线"开始</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customWorldlines.map(wl => (
                <div key={wl.id} className="panel-recessed p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold mb-1">{wl.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{wl.description}</p>
                      <div className="flex gap-4 text-xs">
                        <span className="label">时代: {wl.era}</span>
                        <span className="label">地区: {wl.region}</span>
                        {wl.settingSize && (
                          <span className="label text-accent-teal">
                            设定: {(wl.settingSize / 1024).toFixed(1)} KB
                          </span>
                        )}
                        {wl.lorebook && (
                          <span className="label text-accent-amber">
                            Lorebook: {wl.lorebook.entries.length} 条目
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setSelectedWorldline(wl)}
                        className="px-3 py-1 text-sm bg-secondary"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteWorldline(wl.id)}
                        className="px-3 py-1 text-sm bg-destructive text-destructive-foreground"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 创建/编辑表单 */}
      {isCreating && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="led amber"></div>
            <h4 className="text-lg">创建新世界线</h4>
          </div>

          {/* 基础信息 */}
          <div className="space-y-4">
            <div>
              <label className="label block mb-2">世界线名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：赛博朋克 2077、中世纪欧洲..."
                className="w-full"
              />
            </div>

            <div>
              <label className="label block mb-2">简介</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="简短描述这个世界线..."
                rows={3}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label block mb-2">时代</label>
                <input
                  type="text"
                  value={formData.era}
                  onChange={(e) => setFormData(prev => ({ ...prev, era: e.target.value }))}
                  placeholder="例如：公元 2077 年"
                  className="w-full"
                />
              </div>

              <div>
                <label className="label block mb-2">地区</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="例如：夜之城"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 设定集导入 */}
          <div className="panel-recessed p-4">
            <h5 className="label mb-3">导入大型设定集（可选）</h5>

            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setImportMode('file')}
                className={`px-4 py-2 ${importMode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
              >
                从文件导入
              </button>
              <button
                onClick={() => setImportMode('paste')}
                className={`px-4 py-2 ${importMode === 'paste' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
              >
                粘贴文本
              </button>
            </div>

            {importMode === 'file' ? (
              <div>
                <label className="label block mb-2">选择设定文件（.txt, .md）</label>
                <input
                  type="file"
                  accept=".txt,.md,.markdown"
                  onChange={handleImportFile}
                  className="w-full p-2 border-2 border-border bg-input"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  支持大型文本文件，最大 10 MB
                </p>
              </div>
            ) : (
              <div>
                <label className="label block mb-2">粘贴设定文本</label>
                <textarea
                  value={settingText}
                  onChange={(e) => setSettingText(e.target.value)}
                  placeholder="粘贴你的世界设定文本..."
                  rows={10}
                  className="w-full font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  当前: {settingText.length} 字符 ({(settingText.length / 1024).toFixed(2)} KB)
                </p>
              </div>
            )}

            {settingText.length > 0 && (
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoGenerateLorebook}
                    onChange={(e) => setAutoGenerateLorebook(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    自动将设定拆分为 Lorebook 条目（推荐）
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  将大型设定自动拆分为多个可触发的知识片段，便于 AI 动态加载
                </p>
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsCreating(false);
                setFormData({
                  name: '',
                  description: '',
                  era: '',
                  region: '',
                  culture: [],
                  historicalBackground: '',
                });
                setSettingText('');
              }}
              className="px-6 py-2 bg-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSaveWorldline}
              className="px-6 py-2 bg-primary text-primary-foreground"
            >
              创建世界线
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
