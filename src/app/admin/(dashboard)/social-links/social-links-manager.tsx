"use client";

import { useActionState, useState } from "react";

import {
  createSocialLink,
  deleteSocialLinkAction,
  moveSocialLinkAction,
  updateSocialLink,
} from "@/app/admin/actions";
import { FormError, SubmitButton, useActionToast } from "@/components/admin/form";
import { DeleteButton, OrderControls } from "@/components/admin/list";
import { EmptyState } from "@/components/ui";
import { EditIcon, PlusIcon, SocialIcon } from "@/components/ui/icons";
import { IDLE, type ActionState } from "@/lib/action-state";
import { SOCIAL_PLATFORMS } from "@/lib/validation";
import type { SocialLink } from "@/db/schema";

const INPUT =
  "w-full rounded-lg border border-border-base bg-bg px-3 py-2 text-sm " +
  "placeholder:text-fg-subtle focus:border-accent focus:outline-none";

export function SocialLinksManager({ links }: { links: SocialLink[] }) {
  return (
    <div className="max-w-3xl space-y-6">
      <NewLinkForm />

      {links.length === 0 ? (
        <EmptyState
          title="No social links yet"
          description="Add GitHub, LinkedIn and your email so recruiters can reach you."
        />
      ) : (
        <ul className="space-y-2">
          {links.map((link, index) => (
            <LinkRow
              key={link.id}
              link={link}
              isFirst={index === 0}
              isLast={index === links.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PlatformSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <select name={name} defaultValue={defaultValue ?? "website"} className={INPUT}>
      {SOCIAL_PLATFORMS.map((platform) => (
        <option key={platform} value={platform}>
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </option>
      ))}
    </select>
  );
}

function NewLinkForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createSocialLink, IDLE);
  useActionToast(state);

  return (
    <form action={formAction} className="rounded-xl border border-border-base bg-bg-raised p-5">
      <h2 className="text-sm font-semibold">Add a link</h2>

      <div className="mt-4 space-y-3">
        <FormError state={state} />

        <div className="grid gap-3 sm:grid-cols-[140px_150px_minmax(0,1fr)]">
          <div>
            <label htmlFor="new-link-label" className="mb-1.5 block text-[13px] font-medium">
              Label
            </label>
            <input
              id="new-link-label"
              name="label"
              required
              placeholder="GitHub"
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="new-link-platform" className="mb-1.5 block text-[13px] font-medium">
              Platform
            </label>
            <PlatformSelect name="platform" />
          </div>
          <div>
            <label htmlFor="new-link-url" className="mb-1.5 block text-[13px] font-medium">
              URL
            </label>
            <input
              id="new-link-url"
              name="url"
              required
              placeholder="https://github.com/you"
              className={INPUT}
            />
          </div>
        </div>

        {state.fieldErrors?.url ? (
          <p className="text-[13px] text-danger">{state.fieldErrors.url}</p>
        ) : null}
        {state.fieldErrors?.label ? (
          <p className="text-[13px] text-danger">{state.fieldErrors.label}</p>
        ) : null}

        <input type="hidden" name="isVisible" value="on" />
        <input type="hidden" name="displayOrder" value={0} />

        <SubmitButton>
          <PlusIcon width={15} height={15} />
          Add link
        </SubmitButton>
      </div>
    </form>
  );
}

function LinkRow({
  link,
  isFirst,
  isLast,
}: {
  link: SocialLink;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(updateSocialLink, IDLE);
  useActionToast(state);

  if (editing) {
    return (
      <li>
        <form
          action={formAction}
          className="space-y-3 rounded-xl border border-accent bg-bg-raised p-4"
        >
          <input type="hidden" name="id" value={link.id} />
          <input type="hidden" name="displayOrder" value={link.displayOrder} />

          <div className="grid gap-3 sm:grid-cols-[140px_150px_minmax(0,1fr)]">
            <div>
              <label htmlFor={`label-${link.id}`} className="mb-1.5 block text-[13px] font-medium">
                Label
              </label>
              <input
                id={`label-${link.id}`}
                name="label"
                defaultValue={link.label}
                required
                className={INPUT}
              />
            </div>
            <div>
              <label
                htmlFor={`platform-${link.id}`}
                className="mb-1.5 block text-[13px] font-medium"
              >
                Platform
              </label>
              <PlatformSelect name="platform" defaultValue={link.platform} />
            </div>
            <div>
              <label htmlFor={`url-${link.id}`} className="mb-1.5 block text-[13px] font-medium">
                URL
              </label>
              <input
                id={`url-${link.id}`}
                name="url"
                defaultValue={link.url}
                required
                className={INPUT}
              />
            </div>
          </div>

          {state.fieldErrors?.url ? (
            <p className="text-[13px] text-danger">{state.fieldErrors.url}</p>
          ) : null}

          <label className="flex items-center gap-2 text-[13px] font-medium">
            <input
              type="checkbox"
              name="isVisible"
              defaultChecked={link.isVisible}
              className="h-4 w-4 rounded border-border-strong accent-[var(--accent)]"
            />
            Visible on the public site
          </label>

          <div className="flex gap-2">
            <SubmitButton>Save</SubmitButton>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex h-10 items-center rounded-lg border border-border-base px-4 text-sm font-medium hover:bg-bg-subtle"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border-base bg-bg-raised p-4">
      <OrderControls
        id={link.id}
        label={link.label}
        isFirst={isFirst}
        isLast={isLast}
        action={moveSocialLinkAction}
      />
      <SocialIcon platform={link.platform} width={16} height={16} className="shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{link.label}</p>
        <p className="truncate text-[12px] text-fg-subtle">{link.url}</p>
      </div>
      {link.isVisible ? null : (
        <span className="rounded border border-border-base px-1.5 py-0.5 text-[11px] text-fg-subtle">
          Hidden
        </span>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${link.label}`}
          className="grid h-8 w-8 place-items-center rounded-lg text-fg-subtle hover:bg-bg-subtle hover:text-fg"
        >
          <EditIcon width={14} height={14} />
        </button>
        <DeleteButton
          id={link.id}
          label={link.label}
          entity="Link"
          action={deleteSocialLinkAction}
          compact
        />
      </div>
    </li>
  );
}
