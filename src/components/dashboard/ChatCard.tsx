import type React from 'react';
import { ArrowUp, FileText, Image, Paperclip, X } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import type { ChatAttachment } from '../../lib/chatAttachments';
import type { DashboardChatMessage } from '../../lib/storage';

type ChatCardProps = {
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  messages: DashboardChatMessage[];
  isSendingChat: boolean;
  attachments: ChatAttachment[];
  isPreparingAttachments: boolean;
  attachmentError: string | null;
  chatInput: string;
  setChatInput: (value: string) => void;
  onFilesSelected: (files: FileList | null) => void;
  onRemoveAttachment: (id: string) => void;
  onSend: () => void;
  renderFormattedMessage: (content: string) => React.ReactNode;
  isExpanded?: boolean;
};

export function ChatCard({
  chatScrollRef,
  messages,
  isSendingChat,
  attachments,
  isPreparingAttachments,
  attachmentError,
  chatInput,
  setChatInput,
  onFilesSelected,
  onRemoveAttachment,
  onSend,
  renderFormattedMessage,
  isExpanded = false,
}: ChatCardProps) {
  const canSend = !isSendingChat && !isPreparingAttachments && (chatInput.trim().length > 0 || attachments.length > 0);

  return (
    <Card
      className={`flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border-transparent bg-transparent p-0 shadow-none ${
        isExpanded ? 'h-full overflow-hidden' : 'h-full'
      }`}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          ref={chatScrollRef}
          className="app-scrollbar-hidden min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-1 py-3 text-sm app-muted"
        >
          <div className="flex min-h-full flex-col justify-end space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`min-w-0 ${message.role === 'user' ? 'text-right text-[#F5F2F7]' : 'text-left app-muted'}`}
              >
                <div
                  className={
                    message.role === 'user'
                      ? 'inline-block max-w-[90%] break-words whitespace-pre-wrap rounded-2xl bg-[rgba(109,66,255,0.18)] px-3 py-2 text-left text-[#F5F2F7]'
                      : 'max-w-[90%] break-words whitespace-pre-wrap border-l border-white/[0.08] px-3 py-2'
                  }
                >
                  {renderFormattedMessage(message.content)}
                </div>
              </div>
            ))}
            {isSendingChat ? <div className="text-left text-white/46">L&apos;IA ecrit...</div> : null}
          </div>
        </div>

        <div className="min-w-0 border-t border-white/[0.06] pt-3">
          <div className="min-w-0 rounded-[24px] bg-white/[0.035] p-2">
            {attachments.length > 0 || attachmentError || isPreparingAttachments ? (
              <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2 px-1">
                {attachments.map((attachment) => {
                  const Icon = attachment.kind === 'image' ? Image : FileText;
                  return (
                    <span
                      key={attachment.id}
                      className="inline-flex max-w-full items-center gap-2 rounded-lg bg-white/[0.06] px-2 py-1 text-xs text-white/70"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="max-w-[160px] truncate">{attachment.name}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveAttachment(attachment.id)}
                        className="rounded-full p-0.5 text-white/42 hover:bg-white/8 hover:text-white"
                        aria-label={`Retirer ${attachment.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                {isPreparingAttachments ? <span className="text-xs text-white/42">Preparation...</span> : null}
                {attachmentError ? <span className="text-xs text-[#FFB4B4]">{attachmentError}</span> : null}
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/55 hover:bg-white/[0.06] hover:text-white">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,text/*,.txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.html,.css"
                  className="sr-only"
                  onChange={(event) => {
                    onFilesSelected(event.currentTarget.files);
                    event.currentTarget.value = '';
                  }}
                  aria-label="Joindre des fichiers"
                />
              </label>
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
                  if (canSend) onSend();
                }}
                placeholder="Écris ta question..."
                rows={1}
                className="max-h-52 min-h-[40px] flex-1 resize-none overflow-x-hidden bg-transparent px-1 py-2 text-sm leading-6 text-[#F5F2F7] outline-none placeholder:text-white/38"
              />
              <Button
                onClick={onSend}
                disabled={!canSend}
                className="h-10 w-10 shrink-0 rounded-full bg-[#6d42ff] p-0 text-white hover:bg-[#7b55ff]"
                aria-label="Envoyer"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
