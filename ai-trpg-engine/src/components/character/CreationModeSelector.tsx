import type { CharacterCreationMode } from '../../utils/types';

interface CreationModeSelectorProps {
  mode: CharacterCreationMode;
  onChange: (mode: CharacterCreationMode) => void;
}

export default function CreationModeSelector({
  mode,
  onChange
}: CreationModeSelectorProps) {
  const modes: Array<{
    value: CharacterCreationMode;
    label: string;
    description: string;
    icon: string;
    features: string[];
  }> = [
    {
      value: 'narrative',
      label: '叙事模式',
      description: '自由文本描述，适合注重故事和角色塑造的玩家',
      icon: '📖',
      features: [
        '用自然语言描述角色',
        '无需填写数值属性',
        '快速创建，自由度高',
        '适合叙事导向的游戏'
      ]
    },
    {
      value: 'coc',
      label: 'COC 模式',
      description: '完整的属性和天赋系统，适合喜欢数值和规则的玩家',
      icon: '🎲',
      features: [
        'COC 7版风格属性系统',
        '随机天赋抽取',
        '派生属性计算',
        '适合规则导向的游戏'
      ]
    },
    {
      value: 'hybrid',
      label: '混合模式',
      description: '结合叙事描述和数值属性，获得最完整的角色',
      icon: '⚡',
      features: [
        '叙事描述 + COC属性',
        '灵活性最高',
        '创建时间较长',
        '适合深度角色扮演'
      ]
    }
  ];

  return (
    <div className="bg-card rounded-none p-6 border-4 border-primary">
      <div className="flex items-center gap-3 mb-4">
        <div className="led indicator"></div>
        <h2 className="text-2xl font-bold terminal-text">选择创建模式</h2>
      </div>
      <p className="text-sm text-muted-foreground font-mono mb-6">
        &gt; 选择你喜欢的角色创建方式。不同模式影响创建流程和游戏体验。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`text-left p-6 border-4 rounded-none transition-all ${
              mode === m.value
                ? 'border-primary bg-primary bg-opacity-10'
                : 'border-border hover:border-accent'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{m.icon}</span>
              <div>
                <h3 className="text-lg font-bold">{m.label}</h3>
                {mode === m.value && (
                  <span className="text-xs text-primary terminal-text">● 已选择</span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{m.description}</p>
            <div className="space-y-1">
              {m.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <span className="text-accent-teal">▸</span>
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* 模式切换警告 */}
      {mode !== 'narrative' && (
        <div className="mt-4 panel-recessed p-4">
          <p className="text-xs text-muted-foreground">
            💡 提示：你可以随时在配置中切换模式，但可能需要重新填写部分信息。
          </p>
        </div>
      )}
    </div>
  );
}
