import type { LorebookEntry } from '../../utils/types';

interface LorebookEntryCardProps {
  entry: LorebookEntry;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: () => void;
}

export default function LorebookEntryCard({
  entry,
  onEdit,
  onDelete,
  onToggleEnabled
}: LorebookEntryCardProps) {
  return (
    <div
      className={`panel-raised p-4 transition-opacity ${
        !entry.enabled ? 'opacity-50' : ''
      }`}
    >
      {/* 头部：标题和操作按钮 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{entry.title}</h3>
            {/* 优先级徽章 */}
            <span className="label text-xs px-2 py-1 bg-secondary rounded">
              优先级: {entry.insertionOrder}
            </span>
            {/* 启用状态指示器 */}
            <div className={`led ${entry.enabled ? '' : 'opacity-30'}`} />
          </div>
          {entry.memo && (
            <p className="text-sm text-muted-foreground italic">{entry.memo}</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onToggleEnabled}
            className={`px-3 py-1 text-sm ${
              entry.enabled
                ? 'bg-accent-teal text-white'
                : 'bg-muted text-muted-foreground'
            }`}
            title={entry.enabled ? '点击禁用' : '点击启用'}
          >
            {entry.enabled ? '已启用' : '已禁用'}
          </button>
          <button onClick={onEdit} className="px-3 py-1 text-sm">
            编辑
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm bg-destructive text-destructive-foreground"
          >
            删除
          </button>
        </div>
      </div>

      {/* 关键词标签 */}
      <div className="mb-3">
        <span className="label text-xs mr-2">关键词:</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {entry.keys.map((key, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-primary/20 border border-primary rounded text-sm"
            >
              {entry.useRegex && <span className="text-accent-magenta mr-1">/</span>}
              {key}
              {entry.useRegex && <span className="text-accent-magenta ml-1">/</span>}
              {entry.caseSensitive && <span className="text-accent-amber ml-1">[Aa]</span>}
            </span>
          ))}
        </div>
      </div>

      {/* 内容预览 */}
      <div className="panel-recessed p-3 mb-3">
        <p className="text-sm line-clamp-3">
          {entry.content || <span className="text-muted-foreground italic">无内容</span>}
        </p>
      </div>

      {/* 高级选项指示器 */}
      <div className="flex flex-wrap gap-4 text-xs">
        {entry.secondaryKeys && entry.secondaryKeys.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="led amber" style={{ width: '6px', height: '6px' }} />
            <span className="label">
              次级过滤: {entry.secondaryKeysLogic} ({entry.secondaryKeys.length} 个)
            </span>
          </div>
        )}

        {entry.sticky && (
          <div className="flex items-center gap-2">
            <span className="led magenta" style={{ width: '6px', height: '6px' }} />
            <span className="label">Sticky: {entry.sticky} 条消息</span>
          </div>
        )}

        {entry.cooldown && (
          <div className="flex items-center gap-2">
            <span className="led" style={{ width: '6px', height: '6px' }} />
            <span className="label">Cooldown: {entry.cooldown} 条消息</span>
          </div>
        )}

        {entry.delay && (
          <div className="flex items-center gap-2">
            <span className="led amber" style={{ width: '6px', height: '6px' }} />
            <span className="label">Delay: {entry.delay} 条消息</span>
          </div>
        )}

        {entry.inclusionGroup && (
          <div className="flex items-center gap-2">
            <span className="led magenta" style={{ width: '6px', height: '6px' }} />
            <span className="label">
              包含组: {entry.inclusionGroup} (权重: {entry.groupWeight ?? 100})
            </span>
          </div>
        )}
      </div>

      {/* 时间戳 */}
      {entry.updatedAt && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="label text-xs text-muted-foreground">
            最后更新: {new Date(entry.updatedAt).toLocaleString('zh-CN')}
          </span>
        </div>
      )}
    </div>
  );
}
