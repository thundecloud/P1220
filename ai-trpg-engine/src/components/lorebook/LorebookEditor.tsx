import { useState } from 'react';
import type { Lorebook, LorebookEntry } from '../../utils/types';
import { LorebookService } from '../../services/lorebookService';
import LorebookEntryCard from './LorebookEntryCard';
import LorebookEntryForm from './LorebookEntryForm';

interface LorebookEditorProps {
  lorebook: Lorebook;
  onChange: (lorebook: Lorebook) => void;
  onClose?: () => void;
}

export default function LorebookEditor({ lorebook, onChange, onClose }: LorebookEditorProps) {
  const [editingEntry, setEditingEntry] = useState<LorebookEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤条目
  const filteredEntries = lorebook.entries.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(query) ||
      entry.keys.some(k => k.toLowerCase().includes(query)) ||
      entry.content.toLowerCase().includes(query)
    );
  });

  // 添加新条目
  const handleAddEntry = () => {
    const newEntry = LorebookService.createEntry(
      '新条目',
      ['关键词'],
      '条目内容...'
    );
    setEditingEntry(newEntry);
    setIsCreating(true);
  };

  // 保存条目
  const handleSaveEntry = (entry: LorebookEntry) => {
    const updatedEntries = isCreating
      ? [...lorebook.entries, entry]
      : lorebook.entries.map(e => e.id === entry.id ? entry : e);

    onChange({
      ...lorebook,
      entries: updatedEntries,
      updatedAt: new Date().toISOString()
    });

    setEditingEntry(null);
    setIsCreating(false);
  };

  // 删除条目
  const handleDeleteEntry = (entryId: string) => {
    if (!confirm('确定要删除这个条目吗？')) return;

    onChange({
      ...lorebook,
      entries: lorebook.entries.filter(e => e.id !== entryId),
      updatedAt: new Date().toISOString()
    });
  };

  // 切换启用状态
  const handleToggleEnabled = (entryId: string) => {
    onChange({
      ...lorebook,
      entries: lorebook.entries.map(e =>
        e.id === entryId ? { ...e, enabled: !e.enabled } : e
      ),
      updatedAt: new Date().toISOString()
    });
  };

  // 更新 Lorebook 设置
  const handleUpdateSettings = (field: keyof Lorebook, value: any) => {
    onChange({
      ...lorebook,
      [field]: value,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 头部 */}
      <div className="panel-raised p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl mb-2">{lorebook.name}</h2>
            <p className="label text-muted-foreground">{lorebook.description || '世界知识库编辑器'}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="px-4 py-2">
              关闭
            </button>
          )}
        </div>

        {/* Lorebook 全局设置 */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label block mb-2">扫描深度 (Scan Depth)</label>
            <input
              type="number"
              min="0"
              max="50"
              value={lorebook.scanDepth ?? 10}
              onChange={(e) => handleUpdateSettings('scanDepth', parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              扫描最后 N 条消息 (0=仅递归)
            </p>
          </div>

          <div>
            <label className="label block mb-2">递归扫描 (Recursive)</label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lorebook.recursiveScanning ?? true}
                onChange={(e) => handleUpdateSettings('recursiveScanning', e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm">启用递归扫描</span>
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              激活的条目内容可触发其他条目
            </p>
          </div>

          <div>
            <label className="label block mb-2">上下文预算 (Budget)</label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lorebook.budgetEnabled ?? false}
                onChange={(e) => handleUpdateSettings('budgetEnabled', e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm">启用 Token 限制</span>
            </label>
          </div>

          {lorebook.budgetEnabled && (
            <div>
              <label className="label block mb-2">最大 Token 数</label>
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={lorebook.budgetCap ?? 2000}
                onChange={(e) => handleUpdateSettings('budgetCap', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* 工具栏 */}
      <div className="panel-raised p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索条目（标题、关键词、内容）..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <button
            onClick={handleAddEntry}
            className="px-6 py-2 bg-primary text-primary-foreground"
          >
            + 新建条目
          </button>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <span className="label">
            共 {lorebook.entries.length} 个条目
          </span>
          <span className="label text-accent-teal">
            启用: {lorebook.entries.filter(e => e.enabled).length}
          </span>
          <span className="label text-muted-foreground">
            显示: {filteredEntries.length}
          </span>
        </div>
      </div>

      {/* 条目列表 */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {filteredEntries.length === 0 ? (
          <div className="panel-recessed p-8 text-center text-muted-foreground">
            {searchQuery ? '没有找到匹配的条目' : '还没有任何条目，点击"新建条目"开始'}
          </div>
        ) : (
          filteredEntries
            .sort((a, b) => b.insertionOrder - a.insertionOrder)
            .map(entry => (
              <LorebookEntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => {
                  setEditingEntry(entry);
                  setIsCreating(false);
                }}
                onDelete={() => handleDeleteEntry(entry.id)}
                onToggleEnabled={() => handleToggleEnabled(entry.id)}
              />
            ))
        )}
      </div>

      {/* 编辑表单模态框 */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border-4 border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <LorebookEntryForm
              entry={editingEntry}
              onSave={handleSaveEntry}
              onCancel={() => {
                setEditingEntry(null);
                setIsCreating(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
