import type { NarrativeDescription } from '../../utils/types';

interface NarrativeDescriptionEditorProps {
  description: NarrativeDescription;
  onChange: (description: NarrativeDescription) => void;
}

export default function NarrativeDescriptionEditor({
  description,
  onChange
}: NarrativeDescriptionEditorProps) {
  const updateField = (field: keyof NarrativeDescription, value: string) => {
    onChange({ ...description, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* 核心描述 */}
      <div className="bg-card rounded-none p-6 border-4 border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
          <h2 className="text-2xl font-bold">角色描述</h2>
        </div>
        <p className="text-sm text-muted-foreground font-mono mb-4">
          &gt; 用自然语言描述你的角色。AI 会根据这些描述生成叙事。
        </p>

        <div className="space-y-4">
          {/* 角色描述 */}
          <div>
            <label className="label block mb-2">
              描述 * <span className="text-xs text-muted-foreground ml-2">（外貌、性格、背景的综合描述）</span>
            </label>
            <textarea
              value={description.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="例如：一位来自拜占庭的年轻织工，拥有一双灵巧的手和敏锐的观察力。经历了战乱流离，内心渴望和平与安定..."
              rows={6}
              className="w-full px-4 py-3 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              当前: {description.description.length} 字符
            </p>
          </div>

          {/* 性格特征 */}
          <div>
            <label className="label block mb-2">
              性格 * <span className="text-xs text-muted-foreground ml-2">（性格特点、行为方式）</span>
            </label>
            <textarea
              value={description.personality}
              onChange={(e) => updateField('personality', e.target.value)}
              placeholder="例如：谨慎而坚韧，面对困境不轻易放弃。对技艺充满热情，喜欢思考和创造。对陌生人保持警惕，但一旦信任就会全心对待..."
              rows={4}
              className="w-full px-4 py-3 font-mono text-sm"
            />
          </div>

          {/* 场景/情境 */}
          <div>
            <label className="label block mb-2">
              场景 * <span className="text-xs text-muted-foreground ml-2">（角色当前所处的情境）</span>
            </label>
            <textarea
              value={description.scenario}
              onChange={(e) => updateField('scenario', e.target.value)}
              placeholder="例如：在拜占庭帝国与塞尔柱突厥对峙的年代，你是一名流落到阿勒颇的织工，靠手艺谋生，试图在动荡中寻找生存之道..."
              rows={4}
              className="w-full px-4 py-3 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* 补充信息 */}
      <div className="bg-card rounded-none p-6 border-4 border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="led" style={{ background: 'var(--color-neon-orange)' }}></div>
          <h2 className="text-2xl font-bold">补充信息（可选）</h2>
        </div>

        <div className="space-y-4">
          {/* 首条问候 */}
          <div>
            <label className="label block mb-2">
              首条问候语 <span className="text-xs text-muted-foreground ml-2">（角色的第一句话）</span>
            </label>
            <textarea
              value={description.firstMessage || ''}
              onChange={(e) => updateField('firstMessage', e.target.value)}
              placeholder='例如："你好，我是法丽达，一名织工。在这个动荡的时代，我用双手编织着生存的希望..."'
              rows={3}
              className="w-full px-4 py-3 font-mono text-sm"
            />
          </div>

          {/* 喜好与厌恶 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-2">喜好</label>
              <textarea
                value={description.likes || ''}
                onChange={(e) => updateField('likes', e.target.value)}
                placeholder="例如：编织、安静的工作环境、诚实的人"
                rows={3}
                className="w-full px-4 py-3 font-mono text-sm"
              />
            </div>
            <div>
              <label className="label block mb-2">厌恶</label>
              <textarea
                value={description.dislikes || ''}
                onChange={(e) => updateField('dislikes', e.target.value)}
                placeholder="例如：战争、欺骗、浪费"
                rows={3}
                className="w-full px-4 py-3 font-mono text-sm"
              />
            </div>
          </div>

          {/* 背景故事 */}
          <div>
            <label className="label block mb-2">
              详细背景故事 <span className="text-xs text-muted-foreground ml-2">（可选的深入背景）</span>
            </label>
            <textarea
              value={description.background || ''}
              onChange={(e) => updateField('background', e.target.value)}
              placeholder="例如：出生在拜占庭帝国的一个织工家庭，从小跟随父亲学习编织技艺。在塞尔柱突厥入侵时流离失所..."
              rows={5}
              className="w-full px-4 py-3 font-mono text-sm"
            />
          </div>

          {/* 说话风格 */}
          <div>
            <label className="label block mb-2">
              说话风格 <span className="text-xs text-muted-foreground ml-2">（如何表达自己）</span>
            </label>
            <textarea
              value={description.speech || ''}
              onChange={(e) => updateField('speech', e.target.value)}
              placeholder="例如：说话谨慎，措辞礼貌。喜欢用比喻，常常将生活比作编织。语气平和但坚定..."
              rows={3}
              className="w-full px-4 py-3 font-mono text-sm"
            />
          </div>

          {/* 思维方式 */}
          <div>
            <label className="label block mb-2">
              思维方式 <span className="text-xs text-muted-foreground ml-2">（如何思考和决策）</span>
            </label>
            <textarea
              value={description.thinking || ''}
              onChange={(e) => updateField('thinking', e.target.value)}
              placeholder="例如：倾向于深思熟虑，在做决定前会仔细权衡利弊。重视长远规划，但也能应对突发状况..."
              rows={3}
              className="w-full px-4 py-3 font-mono text-sm"
            />
          </div>

          {/* 对话示例 */}
          <div>
            <label className="label block mb-2">
              对话示例 <span className="text-xs text-muted-foreground ml-2">（帮助 AI 理解角色说话风格）</span>
            </label>
            <textarea
              value={description.exampleDialogs || ''}
              onChange={(e) => updateField('exampleDialogs', e.target.value)}
              placeholder={'例如：\n<用户>: 你为什么选择做织工？\n<角色>: 这是家族的手艺，也是我的天赋。编织让我感到平静，每一根线都有它的位置，就像人生一样。\n<用户>: 你害怕战争吗？\n<角色>: 害怕，但我更害怕失去活下去的勇气。'}
              rows={6}
              className="w-full px-4 py-3 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              用 &lt;用户&gt; 和 &lt;角色&gt; 标记对话双方
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
