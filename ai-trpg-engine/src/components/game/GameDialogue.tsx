import { useState, useRef, useEffect } from 'react';
import type { Message } from '../../utils/types';

interface GameDialogueProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isProcessing: boolean;
}

export default function GameDialogue({ messages, onSendMessage, isProcessing }: GameDialogueProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 对话历史区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-background border-4 border-border rounded-none">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="led mx-auto" style={{ background: 'var(--color-neon-cyan)' }}></div>
              <p className="text-muted-foreground font-mono text-sm">
                &gt; 等待玩家行动...
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-none border-2 ${
                msg.role === 'user'
                  ? 'bg-accent-purple/20 border-accent-purple ml-8'
                  : msg.role === 'assistant'
                  ? 'bg-card border-border mr-8'
                  : 'bg-accent-cyan/20 border-accent-cyan'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="label text-xs font-bold uppercase">
                  {msg.role === 'user' ? '👤 玩家' : msg.role === 'assistant' ? '🎲 DM' : '⚙️ 系统'}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
              {msg.metadata?.checkResult && (
                <div className="mt-3 p-2 bg-background border border-border rounded-none text-xs font-mono">
                  <span className="label">判定:</span> {msg.metadata.checkResult.attribute} - {msg.metadata.checkResult.result}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="mt-4 bg-card rounded-none p-4 border-4 border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="led" style={{ background: isProcessing ? 'var(--color-neon-orange)' : 'var(--color-terminal-green)' }}></div>
          <span className="label text-sm">
            {isProcessing ? '⏳ AI 思考中...' : '📝 输入你的行动'}
          </span>
        </div>

        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isProcessing}
            placeholder="描述你的行动... (Enter 发送, Shift+Enter 换行)"
            className="flex-1 px-4 py-3 rounded-none font-mono text-sm resize-none min-h-[60px] max-h-[200px] disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-none font-bold disabled:opacity-50 flex-shrink-0"
          >
            {isProcessing ? '⏳' : '▶'}
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-mono mt-2">
          &gt; 描述你想做的事情，AI 将根据你的属性和情境生成叙事
        </p>
      </div>
    </div>
  );
}
