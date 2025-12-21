import { useState, useRef } from 'react';

interface AvatarUploadProps {
  avatarUrl?: string;
  onAvatarChange: (avatarUrl: string) => void;
}

export default function AvatarUpload({ avatarUrl, onAvatarChange }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小（限制为 2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    setUploading(true);

    try {
      // 将图片转换为 base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);
        onAvatarChange(base64);
        setUploading(false);
      };
      reader.onerror = () => {
        alert('读取图片失败');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onAvatarChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-card rounded-none p-6 border-4 border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="led" style={{ background: 'var(--color-accent-purple)' }}></div>
        <h2 className="text-2xl font-bold">角色头像（可选）</h2>
      </div>

      <div className="flex items-start gap-6">
        {/* 头像预览 */}
        <div className="flex-shrink-0">
          <div
            className="w-32 h-32 border-4 border-border rounded-none overflow-hidden bg-background flex items-center justify-center"
            style={{
              backgroundImage: preview ? `url(${preview})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!preview && (
              <span className="text-muted-foreground text-sm">无头像</span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex-1 space-y-3">
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-none disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  上传中...
                </>
              ) : (
                <>
                  <span>📤</span>
                  {preview ? '更换头像' : '上传头像'}
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {preview && (
            <button
              onClick={handleRemove}
              className="px-6 py-3 bg-destructive text-destructive-foreground rounded-none"
            >
              🗑️ 移除头像
            </button>
          )}

          <div className="text-xs text-muted-foreground font-mono space-y-1">
            <p>• 支持 JPG、PNG、GIF 等图片格式</p>
            <p>• 文件大小不超过 2MB</p>
            <p>• 推荐尺寸: 512x512 像素</p>
          </div>
        </div>
      </div>
    </div>
  );
}
