import type React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import type { DashboardChatMessage } from '../../lib/storage';

type ChatCardProps = {
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  messages: DashboardChatMessage[];
  isSendingChat: boolean;
  chatInput: string;
  setChatInput: (value: string) => void;
  onSend: () => void;
  renderFormattedMessage: (content: string) => React.ReactNode;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
};

export function ChatCard({
  chatScrollRef,
  messages,
  isSendingChat,
  chatInput,
  setChatInput,
  onSend,
  renderFormattedMessage,
  isExpanded = false,
  onExpandToggle,
}: ChatCardProps) {
  return (
    <Card className={`app-panel rounded-3xl p-6 min-h-0 flex flex-col ${isExpanded ? 'min-h-full' : 'h-full'}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="app-muted text-sm">Chat IA</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Bêta</span>
          {onExpandToggle ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onExpandToggle}
              className="h-9 w-9 rounded-full p-0 text-white/72 hover:bg-white/6 hover:text-white"
              aria-label={isExpanded ? 'Réduire le chat IA' : 'Agrandir le chat IA'}
              title={isExpanded ? 'Réduire le chat IA' : 'Agrandir le chat IA'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      </div>
      <div
        ref={chatScrollRef}
        className={`app-panel-soft overflow-y-auto rounded-2xl p-4 text-sm app-muted space-y-3 ${
          isExpanded ? 'min-h-[calc(100vh-15rem)] flex-1' : 'h-[340px]'
        }`}
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === 'user' ? 'text-right text-[#F5F2F7]' : 'text-left app-muted'}
          >
            <div
              className={
                message.role === 'user'
                  ? 'inline-block max-w-[90%] rounded-2xl bg-[linear-gradient(90deg,rgba(109,66,255,0.22),rgba(95,44,142,0.24))] px-3 py-2 text-left text-[#F5F2F7]'
                  : 'max-w-[90%] rounded-2xl bg-[rgba(18,16,28,0.88)] px-3 py-2'
              }
            >
              {renderFormattedMessage(message.content)}
            </div>
          </div>
        ))}
        {isSendingChat ? <div className="text-left text-white/46">L&apos;IA ecrit...</div> : null}
      </div>
      <div className="mt-6 flex items-center gap-2">
        <Input
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Écris ta question..."
          className="h-10 rounded-xl"
        />
        <Button
          onClick={onSend}
          disabled={isSendingChat || !chatInput.trim()}
          className="h-10 rounded-xl px-4"
        >
          Envoyer
        </Button>
      </div>
    </Card>
  );
}
