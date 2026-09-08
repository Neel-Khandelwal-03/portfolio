"use client";

import { useTransition } from "react";

import { deleteMessageAction, toggleMessageReadAction } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/list";
import { useToast } from "@/components/admin/toast";
import { formatTimestamp } from "@/lib/utils";
import type { ContactMessage } from "@/db/schema";

export function MessageList({ messages }: { messages: ContactMessage[] }) {
  return (
    <ul className="max-w-3xl space-y-3">
      {messages.map((message) => (
        <MessageRow key={message.id} message={message} />
      ))}
    </ul>
  );
}

function MessageRow({ message }: { message: ContactMessage }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function toggle() {
    startTransition(async () => {
      const result = await toggleMessageReadAction(message.id, !message.isRead);
      if (result.status === "error") toast(result.message ?? "Failed.", "error");
    });
  }

  return (
    <li
      className={`rounded-xl border bg-bg-raised p-5 ${
        message.isRead ? "border-border-base" : "border-accent"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {message.name}
            {message.isRead ? null : (
              <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                New
              </span>
            )}
          </p>
          <a
            href={`mailto:${message.email}`}
            className="text-[13px] text-accent hover:underline"
          >
            {message.email}
          </a>
        </div>
        <p className="text-[12px] text-fg-subtle">{formatTimestamp(message.createdAt)}</p>
      </div>

      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-fg-muted">
        {message.message}
      </p>

      <div className="mt-4 flex items-center gap-2 border-t border-border-base pt-3">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="inline-flex h-8 items-center rounded-lg border border-border-base px-3 text-[13px] font-medium hover:bg-bg-subtle disabled:opacity-60"
        >
          Mark as {message.isRead ? "unread" : "read"}
        </button>
        <a
          href={`mailto:${message.email}?subject=Re: your message`}
          className="inline-flex h-8 items-center rounded-lg border border-border-base px-3 text-[13px] font-medium hover:bg-bg-subtle"
        >
          Reply
        </a>
        <div className="ml-auto">
          <DeleteButton
            id={message.id}
            label={`the message from ${message.name}`}
            entity="Message"
            action={deleteMessageAction}
          />
        </div>
      </div>
    </li>
  );
}
