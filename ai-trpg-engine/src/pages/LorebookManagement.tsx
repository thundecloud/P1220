import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LorebookEditor } from '../components/lorebook';
import { LorebookService } from '../services/lorebookService';
import { listLorebooks as listLorebooksTauri, loadLorebook, saveLorebook as saveLorebookTauri, deleteLorebook as deleteLorebookTauri } from '../utils/tauri';
import type { Lorebook } from '../utils/types';

export default function LorebookManagement() {
  const navigate = useNavigate();
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [selectedLorebook, setSelectedLorebook] = useState<Lorebook | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLorebooks();
  }, []);

  const loadLorebooks = async () => {
    try {
      setLoading(true);
      const filenames = await listLorebooksTauri();
      const loadedLorebooks: Lorebook[] = [];

      for (const filename of filenames) {
        try {
          const data = await loadLorebook(filename);
          const lorebook = JSON.parse(data) as Lorebook;
          loadedLorebooks.push(lorebook);
        } catch (error) {
          console.error(`Failed to load lorebook ${filename}:`, error);
        }
      }

      setLorebooks(loadedLorebooks);
    } catch (error) {
      console.error('Failed to list lorebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLorebook = () => {
    const newLorebook = LorebookService.createDefaultLorebook(
      `lorebook_${Date.now()}`,
      '新建知识库'
    );
    setSelectedLorebook(newLorebook);
    setIsCreating(true);
  };

  const handleSaveLorebook = async (lorebook: Lorebook) => {
    try {
      const filename = `${lorebook.id}.json`;
      await saveLorebookTauri(filename, JSON.stringify(lorebook, null, 2));

      if (isCreating) {
        setLorebooks(prev => [...prev, lorebook]);
        setIsCreating(false);
      } else {
        setLorebooks(prev => prev.map(lb => lb.id === lorebook.id ? lorebook : lb));
      }

      alert('Lorebook 保存成功！');
    } catch (error) {
      console.error('Failed to save lorebook:', error);
      alert('保存失败');
    }
  };

  const handleDeleteLorebook = async (id: string) => {
    try {
      const filename = `${id}.json`;
      await deleteLorebookTauri(filename);

      setLorebooks(prev => prev.filter(lb => lb.id !== id));
      if (selectedLorebook?.id === id) {
        setSelectedLorebook(null);
      }

      alert('Lorebook 删除成功！');
    } catch (error) {
      console.error('Failed to delete lorebook:', error);
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-xl font-mono animate-pulse">
          [ LOADING LOREBOOKS... ]
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="panel-raised p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl mb-2">Lorebook 知识库管理</h1>
              <p className="label text-muted-foreground">
                管理世界线知识库和条目，支持动态上下文注入
              </p>
            </div>
            <button
              onClick={() => navigate('/config')}
              className="px-6 py-2 bg-secondary"
            >
              返回配置
            </button>
          </div>
        </div>

        {/* 主内容 */}
        {!selectedLorebook ? (
          /* Lorebook 列表视图 */
          <div>
            <div className="panel-raised p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg">知识库列表</h2>
                <button
                  onClick={handleCreateLorebook}
                  className="px-6 py-2 bg-primary text-primary-foreground"
                >
                  + 创建新知识库
                </button>
              </div>

              {lorebooks.length === 0 ? (
                <div className="panel-recessed p-8 text-center text-muted-foreground">
                  还没有任何知识库，点击"创建新知识库"开始
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lorebooks.map(lorebook => (
                    <div
                      key={lorebook.id}
                      className="panel-raised p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedLorebook(lorebook)}
                    >
                      <h3 className="text-lg font-semibold mb-2">{lorebook.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {lorebook.description || '无描述'}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="label">
                          条目: {lorebook.entries.length}
                        </span>
                        <span className="label text-accent-teal">
                          启用: {lorebook.entries.filter(e => e.enabled).length}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border flex justify-between">
                        <span className="label text-xs text-muted-foreground">
                          {new Date(lorebook.updatedAt || lorebook.createdAt!).toLocaleDateString('zh-CN')}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('确定要删除这个知识库吗？')) {
                              handleDeleteLorebook(lorebook.id);
                            }
                          }}
                          className="text-xs text-destructive hover:underline"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 使用说明 */}
            <div className="panel-raised p-6">
              <h3 className="text-lg mb-3">Lorebook 使用说明</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Lorebook</strong>{' '}
                  是一个动态上下文注入系统，基于 SillyTavern 的 World Info 规范。
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>通过<strong>关键词触发</strong>自动注入相关背景信息</li>
                  <li>支持<strong>正则表达式</strong>和<strong>次级过滤</strong>实现复杂匹配</li>
                  <li><strong>递归扫描</strong>：激活的条目内容可以触发其他条目</li>
                  <li><strong>时序控制</strong>：Sticky、Cooldown、Delay 精确控制激活时机</li>
                  <li><strong>包含组</strong>：互斥内容管理，同组仅一个条目激活</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Lorebook 编辑视图 */
          <div className="panel-raised p-6">
            <LorebookEditor
              lorebook={selectedLorebook}
              onChange={(updatedLorebook) => {
                setSelectedLorebook(updatedLorebook);
                handleSaveLorebook(updatedLorebook);
              }}
              onClose={() => {
                setSelectedLorebook(null);
                setIsCreating(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
