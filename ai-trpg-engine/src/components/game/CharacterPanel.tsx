import type { Character } from '../../utils/types';
import { getAttributeLevel } from '../../services/characterService';

interface CharacterPanelProps {
  character: Character;
}

export default function CharacterPanel({ character }: CharacterPanelProps) {
  const attrs = character.characterAttributes;
  const hasAttributes = !!attrs;

  return (
    <div className="space-y-4">
      {/* 角色基本信息 */}
      <div className="bg-card rounded-none p-4 border-4 border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="led" style={{ background: 'var(--color-accent-purple)' }}></div>
          <h2 className="text-xl font-bold">角色档案</h2>
        </div>

        {/* 头像（如果有）*/}
        {character.avatarUrl && (
          <div className="mb-4 flex justify-center">
            <div
              className="w-32 h-32 border-4 border-border rounded-none overflow-hidden"
              style={{
                backgroundImage: `url(${character.avatarUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>
        )}

        <div className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="label">姓名:</span>
            <span className="font-bold">{character.name}</span>
          </div>
          {character.gender && (
            <div className="flex justify-between">
              <span className="label">性别:</span>
              <span>{character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : '其他'}</span>
            </div>
          )}
          {character.currentAge && (
            <div className="flex justify-between">
              <span className="label">年龄:</span>
              <span>{character.currentAge} 岁</span>
            </div>
          )}
        </div>
      </div>

      {/* COC 属性面板 */}
      {hasAttributes && attrs && (
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="led" style={{ background: 'var(--color-terminal-green)' }}></div>
            <h2 className="text-xl font-bold">基础属性</h2>
          </div>

          <div className="space-y-3">
            {/* 8 项基础属性 */}
            {[
              { key: 'strength', label: 'STR 力量' },
              { key: 'constitution', label: 'CON 体质' },
              { key: 'dexterity', label: 'DEX 敏捷' },
              { key: 'intelligence', label: 'INT 智力' },
              { key: 'education', label: 'EDU 教育' },
              { key: 'power', label: 'POW 意志' },
              { key: 'charisma', label: 'CHA 魅力' },
              { key: 'luck', label: 'LUC 幸运' },
            ].map(({ key, label }) => {
              const value = attrs.basic[key as keyof typeof attrs.basic];
              const level = getAttributeLevel(value);
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="label text-xs flex-shrink-0">{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-background border border-border rounded-none overflow-hidden">
                      <div
                        className="h-full bg-terminal-green"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="font-bold text-sm w-8 text-right">{value}</span>
                    <span className="text-xs text-muted-foreground w-12">{level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 派生属性 */}
      {hasAttributes && attrs && (
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
            <h2 className="text-xl font-bold">派生属性</h2>
          </div>

          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between items-center p-2 bg-background border-2 border-border rounded-none">
              <span className="label">HP 生命值</span>
              <span className="font-bold text-lg">{attrs.derived.hitPoints}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-background border-2 border-border rounded-none">
              <span className="label">SAN 理智值</span>
              <span className="font-bold text-lg">{attrs.derived.sanity}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-background border-2 border-border rounded-none">
              <span className="label">MP 魔力值</span>
              <span className="font-bold text-lg">{attrs.derived.magicPoints}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-background border-2 border-border rounded-none">
              <span className="label">MOV 移动力</span>
              <span className="font-bold text-lg">{attrs.derived.movement}</span>
            </div>
          </div>
        </div>
      )}

      {/* 天赋 */}
      {character.talents && character.talents.length > 0 && (
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="led" style={{ background: 'var(--color-neon-magenta)' }}></div>
            <h2 className="text-xl font-bold">天赋特质</h2>
          </div>

          <div className="space-y-3">
            {character.talents.map((talent) => (
              <div
                key={talent.id}
                className="p-3 bg-background border-2 border-border rounded-none"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{talent.icon}</span>
                  <span className="font-bold text-sm">{talent.name}</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                  {talent.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 技能列表（如果有）*/}
      {hasAttributes && attrs && attrs.skills.length > 0 && (
        <div className="bg-card rounded-none p-4 border-4 border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="led" style={{ background: 'var(--color-neon-orange)' }}></div>
            <h2 className="text-xl font-bold">技能列表</h2>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {attrs.skills.map((skill) => (
              <div
                key={skill.id}
                className="flex justify-between items-center p-2 bg-background border border-border rounded-none text-xs font-mono"
              >
                <span className="label">{skill.name}</span>
                <span className="font-bold">{skill.currentValue}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
