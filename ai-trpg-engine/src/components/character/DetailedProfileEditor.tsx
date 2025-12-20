import { useState } from 'react';
import type { DetailedProfile } from '../../utils/types';

interface DetailedProfileEditorProps {
  profile: DetailedProfile;
  onChange: (profile: DetailedProfile) => void;
}

export default function DetailedProfileEditor({
  profile,
  onChange
}: DetailedProfileEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateProfile = (updates: Partial<DetailedProfile>) => {
    onChange({ ...profile, ...updates });
  };

  const updateAppearance = (updates: Partial<DetailedProfile['appearance']>) => {
    onChange({
      ...profile,
      appearance: { ...profile.appearance, ...updates }
    });
  };

  const addListItem = (field: keyof DetailedProfile, value: string) => {
    if (!value.trim()) return;
    const currentList = (profile[field] as string[] | undefined) || [];
    updateProfile({ [field]: [...currentList, value] });
  };

  const removeListItem = (field: keyof DetailedProfile, index: number) => {
    const currentList = (profile[field] as string[] | undefined) || [];
    updateProfile({ [field]: currentList.filter((_, i) => i !== index) });
  };

  return (
    <div className="bg-card rounded-none border-4 border-border">
      {/* 折叠头部 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="led" style={{ background: isExpanded ? 'var(--color-accent-teal)' : 'var(--color-muted)' }}></div>
          <h2 className="text-2xl font-bold">高级设置 - 详细履历（可选）</h2>
        </div>
        <span className="text-3xl terminal-text">{isExpanded ? '▼' : '►'}</span>
      </button>

      {/* 折叠内容 */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t-4 border-border">
          <p className="text-sm text-muted-foreground font-mono">
            &gt; 填写详细履历信息，AI 将根据这些信息生成更个性化的叙事
          </p>

          {/* 外貌描述 */}
          <div className="panel-recessed p-4">
            <h3 className="label mb-3">外貌描述</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label block mb-1 text-xs">身高</label>
                <input
                  type="text"
                  value={profile.appearance?.height || ''}
                  onChange={(e) => updateAppearance({ height: e.target.value })}
                  placeholder="如: 175cm"
                  className="w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="label block mb-1 text-xs">体重</label>
                <input
                  type="text"
                  value={profile.appearance?.weight || ''}
                  onChange={(e) => updateAppearance({ weight: e.target.value })}
                  placeholder="如: 70kg"
                  className="w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="label block mb-1 text-xs">发色</label>
                <input
                  type="text"
                  value={profile.appearance?.hairColor || ''}
                  onChange={(e) => updateAppearance({ hairColor: e.target.value })}
                  placeholder="如: 黑色"
                  className="w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="label block mb-1 text-xs">瞳色</label>
                <input
                  type="text"
                  value={profile.appearance?.eyeColor || ''}
                  onChange={(e) => updateAppearance({ eyeColor: e.target.value })}
                  placeholder="如: 褐色"
                  className="w-full px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="label block mb-1 text-xs">总体描述</label>
              <textarea
                value={profile.appearance?.generalDescription || ''}
                onChange={(e) => updateAppearance({ generalDescription: e.target.value })}
                placeholder="描述角色的整体外貌、气质..."
                rows={3}
                className="w-full px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>

          {/* 目标与动机 */}
          <div className="panel-recessed p-4">
            <h3 className="label mb-3">目标与动机</h3>
            <StringListInput
              label="人生目标"
              items={profile.goals || []}
              onAdd={(value) => addListItem('goals', value)}
              onRemove={(index) => removeListItem('goals', index)}
              placeholder="如: 成为一名医生"
            />
            <div className="mt-3">
              <StringListInput
                label="内在动机"
                items={profile.motivations || []}
                onAdd={(value) => addListItem('motivations', value)}
                onRemove={(index) => removeListItem('motivations', index)}
                placeholder="如: 追寻父亲的足迹"
              />
            </div>
          </div>

          {/* 信仰与价值观 */}
          <div className="panel-recessed p-4">
            <h3 className="label mb-3">信仰与价值观</h3>
            <StringListInput
              label="信仰"
              items={profile.beliefs || []}
              onAdd={(value) => addListItem('beliefs', value)}
              onRemove={(index) => removeListItem('beliefs', index)}
              placeholder="如: 佛教、科学主义"
            />
            <div className="mt-3">
              <StringListInput
                label="核心价值观"
                items={profile.values || []}
                onAdd={(value) => addListItem('values', value)}
                onRemove={(index) => removeListItem('values', index)}
                placeholder="如: 诚实、正义"
              />
            </div>
          </div>

          {/* 恐惧与弱点 */}
          <div className="panel-recessed p-4">
            <h3 className="label mb-3">恐惧与弱点</h3>
            <StringListInput
              label="恐惧"
              items={profile.fears || []}
              onAdd={(value) => addListItem('fears', value)}
              onRemove={(index) => removeListItem('fears', index)}
              placeholder="如: 黑暗、失去亲人"
            />
            <div className="mt-3">
              <StringListInput
                label="弱点"
                items={profile.weaknesses || []}
                onAdd={(value) => addListItem('weaknesses', value)}
                onRemove={(index) => removeListItem('weaknesses', index)}
                placeholder="如: 过于冲动、不善交际"
              />
            </div>
          </div>

          {/* 爱好与兴趣 */}
          <div className="panel-recessed p-4">
            <h3 className="label mb-3">爱好与兴趣</h3>
            <StringListInput
              label="爱好"
              items={profile.hobbies || []}
              onAdd={(value) => addListItem('hobbies', value)}
              onRemove={(index) => removeListItem('hobbies', index)}
              placeholder="如: 读书、下棋"
            />
          </div>

          {/* 其他备注 */}
          <div className="panel-recessed p-4">
            <h3 className="label mb-3">其他备注</h3>
            <textarea
              value={profile.notes || ''}
              onChange={(e) => updateProfile({ notes: e.target.value })}
              placeholder="任何其他想要记录的信息..."
              rows={4}
              className="w-full px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 字符串列表输入组件
function StringListInput({
  label,
  items,
  onAdd,
  onRemove,
  placeholder
}: {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div>
      <label className="label block mb-2 text-xs">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-accent-teal text-black text-sm"
        >
          + 添加
        </button>
      </div>
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-background border border-border px-3 py-2"
            >
              <span className="text-sm font-mono">{item}</span>
              <button
                onClick={() => onRemove(index)}
                className="text-destructive hover:text-destructive-foreground text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
