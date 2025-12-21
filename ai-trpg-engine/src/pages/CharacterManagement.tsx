import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Character } from '../utils/types';
import {
  downloadCharacterCard,
  downloadCharacterCardPNG,
  importCharacterFromFile,
} from '../services/characterCardService';
import { useCharacterStore } from '../stores/characterStore';

export default function CharacterManagement() {
  const navigate = useNavigate();
  const store = useCharacterStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 加载角色列表
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = () => {
    // TODO: 从本地存储或服务器加载角色列表
    // 这里暂时使用当前角色
    if (store.character) {
      setCharacters([store.character]);
    }
  };

  // 导入角色（JSON 或 PNG）
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const character = await importCharacterFromFile(file);

      // 添加到角色列表
      setCharacters([...characters, character]);

      alert(`成功导入角色: ${character.name}`);
    } catch (error) {
      alert(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 导出为 JSON
  const handleExportJSON = (character: Character) => {
    try {
      downloadCharacterCard(character);
      alert(`成功导出 ${character.name} 的角色卡`);
    } catch (error) {
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 导出为 PNG（需要上传图片）
  const handleExportPNG = async (character: Character) => {
    const input = imageInputRef.current;
    if (!input) return;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await downloadCharacterCardPNG(file, character);
        alert(`成功导出 ${character.name} 的角色卡 PNG`);
      } catch (error) {
        alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      // 重置文件输入
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    };

    input.click();
  };

  // 删除角色
  const handleDelete = (character: Character) => {
    if (!confirm(`确定要删除角色 "${character.name}" 吗？`)) {
      return;
    }

    setCharacters(characters.filter(c => c.id !== character.id));
  };

  // 加载角色到游戏
  const handleLoadCharacter = (character: Character) => {
    store.setCharacter(character);
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题栏 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/config')}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-none"
              >
                ← 返回
              </button>
              <h1 className="text-4xl font-bold terminal-text">角色管理</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="led indicator"></div>
              <span className="label">SillyTavern 兼容</span>
            </div>
          </div>
          <p className="text-muted-foreground font-mono">
            &gt; 管理角色卡，支持 Character Card V2 格式导入导出
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="bg-card rounded-none p-6 border-4 border-primary mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-none flex items-center gap-2"
            >
              <span>📥</span>
              导入角色卡（JSON/PNG）
            </button>
            <button
              onClick={() => navigate('/character-creation')}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-none flex items-center gap-2"
            >
              <span>➕</span>
              创建新角色
            </button>
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.png"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png"
            style={{ display: 'none' }}
          />
        </div>

        {/* 角色列表 */}
        <div className="bg-card rounded-none border-4 border-border">
          <div className="p-6 border-b-4 border-border">
            <div className="flex items-center gap-3">
              <div className="led" style={{ background: 'var(--color-neon-cyan)' }}></div>
              <h2 className="text-2xl font-bold">我的角色</h2>
              <span className="label ml-auto">{characters.length} 个角色</span>
            </div>
          </div>

          <div className="p-6">
            {characters.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-mono mb-4">
                  暂无角色，请创建或导入角色卡
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className="bg-background border-2 border-border p-4 rounded-none hover:border-primary transition-colors"
                  >
                    {/* 角色信息 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold terminal-text">{character.name}</h3>
                        {character.creationMode && (
                          <span className="label text-xs">
                            {character.creationMode === 'narrative' ? '叙事' :
                             character.creationMode === 'coc' ? 'COC' : '混合'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-mono line-clamp-2">
                        {character.narrativeDescription?.description ||
                         character.story ||
                         '暂无描述'}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        创建于: {new Date(character.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleLoadCharacter(character)}
                        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-none text-sm"
                      >
                        🎮 加载到游戏
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleExportJSON(character)}
                          className="px-3 py-2 bg-secondary text-secondary-foreground rounded-none text-xs"
                        >
                          导出 JSON
                        </button>
                        <button
                          onClick={() => handleExportPNG(character)}
                          className="px-3 py-2 bg-secondary text-secondary-foreground rounded-none text-xs"
                        >
                          导出 PNG
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(character)}
                        className="w-full px-3 py-2 bg-destructive text-destructive-foreground rounded-none text-xs"
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 说明文档 */}
        <div className="mt-6 bg-card rounded-none p-6 border-4 border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="led" style={{ background: 'var(--color-accent-teal)' }}></div>
            <h2 className="text-xl font-bold">使用说明</h2>
          </div>
          <div className="space-y-3 text-sm font-mono text-muted-foreground">
            <div>
              <strong className="text-foreground">📥 导入角色卡：</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>支持 SillyTavern 的 Character Card V2 格式（JSON）</li>
                <li>支持从 PNG 图片中提取嵌入的角色卡数据</li>
                <li>导入的角色会自动转换为本系统格式</li>
              </ul>
            </div>
            <div>
              <strong className="text-foreground">📤 导出角色卡：</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><strong>JSON 格式：</strong>标准的 Character Card V2 JSON 文件</li>
                <li><strong>PNG 格式：</strong>将角色卡数据嵌入到图片的元数据中</li>
                <li>导出的文件可以在 SillyTavern 等工具中使用</li>
              </ul>
            </div>
            <div>
              <strong className="text-foreground">🔄 兼容性：</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>完全兼容 SillyTavern Character Card V2 规范</li>
                <li>保留所有扩展数据（属性、天赋、详细履历等）</li>
                <li>可以在不同系统之间自由导入导出</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
