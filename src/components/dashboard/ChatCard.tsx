import type React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
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
    <Card
      className={`app-panel flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl p-6 ${
        isExpanded ? 'h-full overflow-hidden' : 'h-full'
      }`}
    >
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
        className={`app-panel-soft flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl ${
          isExpanded ? 'h-full' : 'h-[340px]'
        }`}
      >
        <div
          ref={chatScrollRef}
          className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4 text-sm app-muted"
        >
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`min-w-0 ${message.role === 'user' ? 'text-right text-[#F5F2F7]' : 'text-left app-muted'}`}
            >
              <div
                className={
                  message.role === 'user'
                    ? 'inline-block max-w-[90%] break-words whitespace-pre-wrap rounded-2xl bg-[linear-gradient(90deg,rgba(109,66,255,0.22),rgba(95,44,142,0.24))] px-3 py-2 text-left text-[#F5F2F7]'
                    : 'max-w-[90%] break-words whitespace-pre-wrap rounded-2xl bg-[rgba(18,16,28,0.88)] px-3 py-2'
                }
              >
                {renderFormattedMessage(message.content)}
              </div>
            </div>
          ))}
          {isSendingChat ? <div className="text-left text-white/46">L&apos;IA ecrit...</div> : null}
        </div>

        <div className="min-w-0 border-t border-white/8 p-3">
          <div className="min-w-0 rounded-2xl border border-white/10 bg-[rgba(17,15,27,0.92)] p-3">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;

                if (event.metaKey || event.ctrlKey) {
                  const target = event.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const nextValue = `${chatInput.slice(0, start)}\n${chatInput.slice(end)}`;
                  event.preventDefault();
                  setChatInput(nextValue);

                  requestAnimationFrame(() => {
                    target.selectionStart = start + 1;
                    target.selectionEnd = start + 1;
                  });
                  return;
                }

                event.preventDefault();
                onSend();
              }}
              placeholder="Écris ta question..."
              rows={isExpanded ? 5 : 3}
              className="max-h-52 min-h-[72px] w-full resize-none overflow-x-hidden bg-transparent text-sm text-[#F5F2F7] outline-none placeholder:text-white/38"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="min-w-0 flex-1 text-xs text-white/40">Entrée pour envoyer, Cmd/Ctrl + Entrée pour un retour à la ligne</p>
              <Button
                onClick={onSend}
                disabled={isSendingChat || !chatInput.trim()}
                className="h-10 rounded-xl px-4"
              >
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
