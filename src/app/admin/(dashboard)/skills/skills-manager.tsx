"use client";

import { useActionState, useState } from "react";

import {
  createSkill,
  createSkillCategory,
  deleteSkillAction,
  deleteSkillCategoryAction,
  moveSkillAction,
  updateSkill,
  updateSkillCategory,
} from "@/app/admin/actions";
import { FormError, SubmitButton, useActionToast } from "@/components/admin/form";
import { DeleteButton, OrderControls } from "@/components/admin/list";
import { EmptyState } from "@/components/ui";
import { EditIcon, PlusIcon } from "@/components/ui/icons";
import { IDLE, type ActionState } from "@/lib/action-state";
import { slugify } from "@/lib/validation";
import type { SkillGroup } from "@/services/portfolio";

/**
 * Skills are edited inline rather than on separate pages.
 *
 * Each skill is one short string, so a full navigation per edit would be more
 * friction than the change itself is worth.
 */

const INPUT =
  "w-full rounded-lg border border-border-base bg-bg px-3 py-2 text-sm " +
  "placeholder:text-fg-subtle focus:border-accent focus:outline-none";

export function SkillsManager({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="space-y-6">
      <NewCategoryForm />

      {groups.length === 0 ? (
        <EmptyState
          title="No skill categories yet"
          description="Create a category above, then add skills to it."
        />
      ) : (
        groups.map((group) => <CategoryCard key={group.id} group={group} />)
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Category                                                                    */
/* -------------------------------------------------------------------------- */

function NewCategoryForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createSkillCategory, IDLE);
  const [name, setName] = useState("");
  useActionToast(state);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-border-base bg-bg-raised p-5"
      onSubmit={() => setName("")}
    >
      <h2 className="text-sm font-semibold">Add a category</h2>
      <p className="mt-1 text-[13px] text-fg-subtle">
        Categories group skills on the public site, e.g. Programming, Web Development.
      </p>

      <div className="mt-4 space-y-3">
        <FormError state={state} />
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="new-category-name" className="sr-only">
              Category name
            </label>
            <input
              id="new-category-name"
              name="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Category name"
              className={INPUT}
            />
            {state.fieldErrors?.name ? (
              <p className="mt-1.5 text-[13px] text-danger">{state.fieldErrors.name}</p>
            ) : null}
          </div>
          <input type="hidden" name="slug" value={slugify(name)} />
          <input type="hidden" name="displayOrder" value={0} />
          <SubmitButton>
            <PlusIcon width={15} height={15} />
            Add category
          </SubmitButton>
        </div>
        {state.fieldErrors?.slug ? (
          <p className="text-[13px] text-danger">{state.fieldErrors.slug}</p>
        ) : null}
      </div>
    </form>
  );
}

function CategoryCard({ group }: { group: SkillGroup }) {
  const [renaming, setRenaming] = useState(false);

  return (
    <section className="rounded-xl border border-border-base bg-bg-raised">
      <header className="flex flex-wrap items-center gap-3 border-b border-border-base p-4">
        {renaming ? (
          <RenameCategoryForm group={group} onDone={() => setRenaming(false)} />
        ) : (
          <>
            <h2 className="text-sm font-semibold">{group.name}</h2>
            <span className="rounded border border-border-base px-1.5 py-0.5 text-[11px] text-fg-subtle">
              {group.skills.length} {group.skills.length === 1 ? "skill" : "skills"}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRenaming(true)}
                aria-label={`Rename ${group.name}`}
                className="grid h-8 w-8 place-items-center rounded-lg text-fg-subtle hover:bg-bg-subtle hover:text-fg"
              >
                <EditIcon width={14} height={14} />
              </button>
              <DeleteButton
                id={group.id}
                label={`${group.name} (and its ${group.skills.length} skills)`}
                entity="Category"
                action={deleteSkillCategoryAction}
                compact
              />
            </div>
          </>
        )}
      </header>

      <div className="p-4">
        {group.skills.length === 0 ? (
          <p className="mb-3 text-[13px] text-fg-subtle">No skills in this category yet.</p>
        ) : (
          <ul className="mb-4 space-y-1.5">
            {group.skills.map((skill, index) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                categoryId={group.id}
                isFirst={index === 0}
                isLast={index === group.skills.length - 1}
              />
            ))}
          </ul>
        )}

        <NewSkillForm categoryId={group.id} categoryName={group.name} />
      </div>
    </section>
  );
}

function RenameCategoryForm({ group, onDone }: { group: SkillGroup; onDone: () => void }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateSkillCategory, IDLE);
  const [name, setName] = useState(group.name);
  useActionToast(state);

  return (
    <form action={formAction} className="flex w-full flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={group.id} />
      <input type="hidden" name="slug" value={slugify(name)} />
      <input type="hidden" name="displayOrder" value={group.displayOrder} />

      <label htmlFor={`rename-${group.id}`} className="sr-only">
        Category name
      </label>
      <input
        id={`rename-${group.id}`}
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
        className={`${INPUT} max-w-xs flex-1`}
      />
      <SubmitButton>Save</SubmitButton>
      <button
        type="button"
        onClick={onDone}
        className="inline-flex h-10 items-center rounded-lg border border-border-base px-3 text-sm font-medium hover:bg-bg-subtle"
      >
        Cancel
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

function SkillRow({
  skill,
  categoryId,
  isFirst,
  isLast,
}: {
  skill: SkillGroup["skills"][number];
  categoryId: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(updateSkill, IDLE);
  useActionToast(state);

  if (editing) {
    return (
      <li>
        <form
          action={formAction}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-accent bg-bg p-2"
        >
          <input type="hidden" name="id" value={skill.id} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="displayOrder" value={skill.displayOrder} />
          <input type="hidden" name="isVisible" value={skill.isVisible ? "on" : ""} />

          <label htmlFor={`skill-${skill.id}`} className="sr-only">
            Skill name
          </label>
          <input
            id={`skill-${skill.id}`}
            name="name"
            defaultValue={skill.name}
            autoFocus
            className={`${INPUT} min-w-[160px] flex-1`}
          />
          <SubmitButton>Save</SubmitButton>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex h-10 items-center rounded-lg border border-border-base px-3 text-sm font-medium hover:bg-bg-subtle"
          >
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border-base bg-bg px-3 py-2">
      <OrderControls
        id={skill.id}
        label={skill.name}
        isFirst={isFirst}
        isLast={isLast}
        action={moveSkillAction}
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{skill.name}</span>
      {skill.isVisible ? null : (
        <span className="rounded border border-border-base px-1.5 py-0.5 text-[11px] text-fg-subtle">
          Hidden
        </span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${skill.name}`}
        className="grid h-8 w-8 place-items-center rounded-lg text-fg-subtle hover:bg-bg-subtle hover:text-fg"
      >
        <EditIcon width={14} height={14} />
      </button>
      <DeleteButton
        id={skill.id}
        label={skill.name}
        entity="Skill"
        action={deleteSkillAction}
        compact
      />
    </li>
  );
}

function NewSkillForm({ categoryId, categoryName }: { categoryId: number; categoryName: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createSkill, IDLE);
  const [name, setName] = useState("");
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-wrap gap-2" onSubmit={() => setName("")}>
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="displayOrder" value={0} />
      <input type="hidden" name="isVisible" value="on" />
      <input type="hidden" name="proficiency" value="" />

      <label htmlFor={`new-skill-${categoryId}`} className="sr-only">
        New skill in {categoryName}
      </label>
      <input
        id={`new-skill-${categoryId}`}
        name="name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={`Add a skill to ${categoryName}`}
        className={`${INPUT} min-w-[180px] flex-1`}
      />
      <SubmitButton>
        <PlusIcon width={15} height={15} />
        Add
      </SubmitButton>
      {state.fieldErrors?.name ? (
        <p className="w-full text-[13px] text-danger">{state.fieldErrors.name}</p>
      ) : null}
    </form>
  );
}
