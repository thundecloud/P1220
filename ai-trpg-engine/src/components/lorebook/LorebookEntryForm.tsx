import { useState } from 'react';
import type { LorebookEntry } from '../../utils/types';

interface LorebookEntryFormProps {
  entry: LorebookEntry;
  onSave: (entry: LorebookEntry) => void;
  onCancel: () => void;
}

type TabType = 'basic' | 'advanced' | 'timing';

export default function LorebookEntryForm({
  entry: initialEntry,
  onSave,
  onCancel
}: LorebookEntryFormProps) {
  const [entry, setEntry] = useState<LorebookEntry>(initialEntry);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [keyInput, setKeyInput] = useState('');
  const [secondaryKeyInput, setSecondaryKeyInput] = useState('');

  const updateEntry = (field: keyof LorebookEntry, value: any) => {
    setEntry(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleAddKey = () => {
    if (!keyInput.trim()) return;
    updateEntry('keys', [...entry.keys, keyInput.trim()]);
    setKeyInput('');
  };

  const handleRemoveKey = (index: number) => {
    updateEntry('keys', entry.keys.filter((_, i) => i !== index));
  };

  const handleAddSecondaryKey = () => {
    if (!secondaryKeyInput.trim()) return;
    const current = entry.secondaryKeys || [];
    updateEntry('secondaryKeys', [...current, secondaryKeyInput.trim()]);
    setSecondaryKeyInput('');
  };

  const handleRemoveSecondaryKey = (index: number) => {
    const current = entry.secondaryKeys || [];
    updateEntry('secondaryKeys', current.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!entry.title.trim()) {
      alert('请输入条目标题');
      return;
    }
    if (entry.keys.length === 0) {
      alert('请至少添加一个关键词');
      return;
    }
    if (!entry.content.trim()) {
      alert('请输入条目内容');
      return;
    }

    onSave(entry);
  };

  return (
    <div className="p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-xl mb-2">
          {initialEntry.title === '新条目' ? '创建新条目' : '编辑条目'}
        </h2>
        <div className="divider" />
      </div>

      {/* 标签页导航 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-4 py-2 ${
            activeTab === 'basic'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary'
          }`}
        >
          基础设置
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-4 py-2 ${
            activeTab === 'advanced'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary'
          }`}
        >
          高级选项
        </button>
        <button
          onClick={() => setActiveTab('timing')}
          className={`px-4 py-2 ${
            activeTab === 'timing'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary'
          }`}
        >
          时序控制
        </button>
      </div>

      {/* 表单内容 */}
      <div className="space-y-6">
        {/* 基础设置 */}
        {activeTab === 'basic' && (
          <>
            {/* 标题 */}
            <div>
              <label className="label block mb-2">条目标题 *</label>
              <input
                type="text"
                value={entry.title}
                onChange={(e) => updateEntry('title', e.target.value)}
                placeholder="条目的名称（仅用于管理）"
                className="w-full"
              />
            </div>

            {/* 备注 */}
            <div>
              <label className="label block mb-2">备注 (Memo)</label>
              <input
                type="text"
                value={entry.memo || ''}
                onChange={(e) => updateEntry('memo', e.target.value)}
                placeholder="简短的提示信息"
                className="w-full"
              />
            </div>

            {/* 关键词 */}
            <div>
              <label className="label block mb-2">触发关键词 * (Keys)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKey()}
                  placeholder="输入关键词后按 Enter 添加"
                  className="flex-1"
                />
                <button onClick={handleAddKey} className="px-4 py-2">
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {entry.keys.map((key, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary/20 border border-primary rounded flex items-center gap-2"
                  >
                    {key}
                    <button
                      onClick={() => handleRemoveKey(idx)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={entry.useRegex || false}
                    onChange={(e) => updateEntry('useRegex', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">使用正则表达式</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={entry.caseSensitive || false}
                    onChange={(e) => updateEntry('caseSensitive', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">区分大小写</span>
                </label>
              </div>
            </div>

            {/* 内容 */}
            <div>
              <label className="label block mb-2">注入内容 * (Content)</label>
              <textarea
                value={entry.content}
                onChange={(e) => updateEntry('content', e.target.value)}
                placeholder="激活时注入到 AI 提示词的内容..."
                rows={8}
                className="w-full font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                这段内容将在关键词匹配时动态注入到 AI 上下文中
              </p>
            </div>

            {/* 插入顺序 */}
            <div>
              <label className="label block mb-2">插入优先级 (Insertion Order)</label>
              <input
                type="number"
                value={entry.insertionOrder}
                onChange={(e) => updateEntry('insertionOrder', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                数值越大，越晚插入，影响力越强（建议范围：0-1000）
              </p>
            </div>
          </>
        )}

        {/* 高级选项 */}
        {activeTab === 'advanced' && (
          <>
            {/* 次级关键词 */}
            <div>
              <label className="label block mb-2">次级关键词 (Secondary Keys)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={secondaryKeyInput}
                  onChange={(e) => setSecondaryKeyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSecondaryKey()}
                  placeholder="输入次级关键词后按 Enter"
                  className="flex-1"
                />
                <button onClick={handleAddSecondaryKey} className="px-4 py-2">
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {(entry.secondaryKeys || []).map((key, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-accent-amber/20 border border-accent-amber rounded flex items-center gap-2"
                  >
                    {key}
                    <button
                      onClick={() => handleRemoveSecondaryKey(idx)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* 次级关键词逻辑 */}
              {(entry.secondaryKeys?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <label className="label block mb-2">次级过滤逻辑</label>
                  <select
                    value={entry.secondaryKeysLogic || 'AND_ANY'}
                    onChange={(e) => updateEntry('secondaryKeysLogic', e.target.value as any)}
                    className="w-full"
                  >
                    <option value="AND_ANY">AND_ANY (至少匹配一个)</option>
                    <option value="AND_ALL">AND_ALL (匹配所有)</option>
                    <option value="NOT_ANY">NOT_ANY (不匹配任何)</option>
                    <option value="NOT_ALL">NOT_ALL (不是所有都匹配)</option>
                  </select>
                </div>
              )}
            </div>

            {/* 包含组 */}
            <div>
              <label className="label block mb-2">包含组 (Inclusion Group)</label>
              <input
                type="text"
                value={entry.inclusionGroup || ''}
                onChange={(e) => updateEntry('inclusionGroup', e.target.value)}
                placeholder="同组内仅一个条目会被激活"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                相同组名的条目，同时只会激活一个（用于互斥内容）
              </p>

              {entry.inclusionGroup && (
                <div className="mt-3">
                  <label className="label block mb-2">组内权重</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={entry.groupWeight ?? 100}
                    onChange={(e) => updateEntry('groupWeight', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    权重越高，越可能被选中（默认：100）
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* 时序控制 */}
        {activeTab === 'timing' && (
          <>
            {/* Sticky */}
            <div>
              <label className="label block mb-2">Sticky (保持激活)</label>
              <input
                type="number"
                min="0"
                value={entry.sticky ?? 0}
                onChange={(e) => updateEntry('sticky', parseInt(e.target.value) || undefined)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                激活后保持 N 条消息内持续生效（0 = 不启用）
              </p>
            </div>

            {/* Cooldown */}
            <div>
              <label className="label block mb-2">Cooldown (冷却时间)</label>
              <input
                type="number"
                min="0"
                value={entry.cooldown ?? 0}
                onChange={(e) => updateEntry('cooldown', parseInt(e.target.value) || undefined)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                激活后 N 条消息内不可重新触发（0 = 不启用）
              </p>
            </div>

            {/* Delay */}
            <div>
              <label className="label block mb-2">Delay (延迟激活)</label>
              <input
                type="number"
                min="0"
                value={entry.delay ?? 0}
                onChange={(e) => updateEntry('delay', parseInt(e.target.value) || undefined)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                至少需要 N 条消息后才可激活（0 = 不启用）
              </p>
            </div>

            {/* 说明 */}
            <div className="panel-recessed p-4">
              <h4 className="label mb-2">时序控制说明</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Sticky</strong>: 保持条目在一段时间内持续生效</li>
                <li><strong>Cooldown</strong>: 防止条目频繁触发，节省 token</li>
                <li><strong>Delay</strong>: 延迟条目激活，适合中后期才出现的内容</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
        <button onClick={onCancel} className="px-6 py-2 bg-secondary">
          取消
        </button>
        <button onClick={handleSave} className="px-6 py-2 bg-primary text-primary-foreground">
          保存
        </button>
      </div>
    </div>
  );
}
