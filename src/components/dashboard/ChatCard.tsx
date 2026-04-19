import type React from 'react';
import { ArrowUp, FileText, Image, Maximize2, Minimize2, Paperclip, X } from 'lucide-react';

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
  onExpandToggle?: () => void;
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
  onExpandToggle,
}: ChatCardProps) {
  const canSend = !isSendingChat && !isPreparingAttachments && (chatInput.trim().length > 0 || attachments.length > 0);

  return (
    <Card
      className={`app-panel flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl p-6 ${
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

      <div className="app-panel-soft flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
        <div
          ref={chatScrollRef}
          className="app-scrollbar-hidden min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 text-sm app-muted"
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
        </div>

        <div className="min-w-0 border-t border-white/8 p-2.5">
          <div className="min-w-0 rounded-[28px] border border-white/10 bg-[rgba(18,16,28,0.92)] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            {attachments.length > 0 || attachmentError || isPreparingAttachments ? (
              <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2 px-1">
                {attachments.map((attachment) => {
                  const Icon = attachment.kind === 'image' ? Image : FileText;
                  return (
                    <span
                      key={attachment.id}
                      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70"
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
                <button
                  type="button"
                  onClick={() =>
                    setChatInput(
                      "Cree un quiz interactif de 7 questions base sur les fichiers joints. Pose une seule question a la fois. Apres chacune de mes reponses, dis si c'est juste ou faux et donne une explication detaillee avant de passer a la question suivante."
                    )
                  }
                  className="inline-flex h-7 items-center rounded-lg border border-[#9F7BFF]/28 bg-[rgba(109,66,255,0.14)] px-3 text-xs font-semibold text-[#F5F2F7] hover:bg-[rgba(109,66,255,0.22)]"
                >
                  Créer un quiz
                </button>
                {isPreparingAttachments ? <span className="text-xs text-white/42">Preparation...</span> : null}
                {attachmentError ? <span className="text-xs text-[#FFB4B4]">{attachmentError}</span> : null}
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/55 hover:bg-white/6 hover:text-white">
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
                className="h-10 w-10 shrink-0 rounded-full bg-[#111318] p-0 text-white hover:bg-[#1B1E26]"
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
