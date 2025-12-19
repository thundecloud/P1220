import { useNavigate } from 'react-router-dom';

export default function GameMain() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">游戏进行中</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80 text-sm"
          >
            返回主菜单
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Character Info */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4">角色信息</h2>
              <p className="text-muted-foreground text-sm">角色面板 - 即将完成</p>
            </div>
          </div>

          {/* Right Panel - Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg p-6 border border-border h-full">
              <h2 className="text-xl font-semibold mb-4">故事</h2>
              <p className="text-muted-foreground text-sm">游戏主界面 - 即将完成</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
