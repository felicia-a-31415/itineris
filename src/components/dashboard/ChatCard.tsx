import type React from 'react';

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
};

export function ChatCard({
  chatScrollRef,
  messages,
  isSendingChat,
  chatInput,
  setChatInput,
  onSend,
  renderFormattedMessage,
}: ChatCardProps) {
  return (
    <Card className="bg-[#161924] border-[#1F2230] rounded-3xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.06)] h-full min-h-0 flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-[#A9ACBA]">Chat IA</p>
        <span className="text-xs text-[#7F869A]">Bêta</span>
      </div>
      <div
        ref={chatScrollRef}
        className="h-[340px] overflow-y-auto rounded-2xl border border-[#1F2230] bg-[#0F1117] p-4 text-sm text-[#A9ACBA] space-y-3"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === 'user' ? 'text-right text-[#ECECF3]' : 'text-left text-[#A9ACBA]'}
          >
            <div
              className={
                message.role === 'user'
                  ? 'inline-block max-w-[90%] rounded-2xl bg-[#1C2233] px-3 py-2 text-left'
                  : 'max-w-[90%] rounded-2xl bg-[#131722] px-3 py-2'
              }
            >
              {renderFormattedMessage(message.content)}
            </div>
          </div>
        ))}
        {isSendingChat ? <div className="text-left text-[#7F869A]">L&apos;IA ecrit...</div> : null}
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
          className="h-10 rounded-xl border-[#1F2230] bg-[#0F1117] text-[#ECECF3]"
        />
        <Button
          onClick={onSend}
          disabled={isSendingChat || !chatInput.trim()}
          className="h-10 rounded-xl bg-[#4169E1] hover:bg-[#3557C1] text-white px-4"
        >
          Envoyer
        </Button>
      </div>
    </Card>
  );
}
