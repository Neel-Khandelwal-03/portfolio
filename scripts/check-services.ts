import "./load-env";

import { sql } from "@/db";
import { fieldErrorsFrom } from "@/lib/action-state";
import { projectSchema } from "@/lib/validation";
import { sketchWhiteboard, webAppWhiteboard } from "@/lib/whiteboard";
import * as svc from "@/services/portfolio";
import * as t from "@/db/schema";

/**
 * Smoke test for the data-access layer: exercises read/create/update/delete and
 * the ordering helper against the real database, then cleans up after itself.
 *
 * Run with `npx tsx scripts/check-services.ts`.
 */

// This suite creates, reorders and deletes real rows. Pointed at the live
// database by mistake it would shuffle the published project order, so it
// refuses anything but a local server unless told otherwise explicitly.
const databaseHost = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();
if (
  !["localhost", "127.0.0.1", "::1"].includes(databaseHost) &&
  process.env.ALLOW_REMOTE_DB_CHECKS !== "1"
) {
  console.error(
    `Refusing to run against ${databaseHost || "an unknown host"}: these checks write to the ` +
      "database. Point DATABASE_URL at a local or branch database, or set " +
      "ALLOW_REMOTE_DB_CHECKS=1 if this really is a disposable copy.",
  );
  process.exit(1);
}

let failures = 0;

function check(label: string, condition: boolean, extra?: unknown) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${label}`, extra ?? "");
  }
}

async function main() {
  console.log("\nReads");
  const profile = await svc.getProfileForAdmin();
  check("profile loads", profile.fullName.length > 0, profile.fullName);

  const settings = await svc.getSiteSettingsForAdmin();
  check("site settings load", settings.siteTitle.length > 0);

  const groups = await svc.getSkillGroupsForAdmin();
  check("skill groups load with skills", groups.length > 0 && groups[0].skills.length > 0, {
    categories: groups.length,
    firstCategorySkills: groups[0]?.skills.length,
  });

  const projects = await svc.listProjectsForAdmin();
  check("projects load", projects.length > 0, projects.length);

  const stats = await svc.getDashboardStats();
  check("dashboard stats aggregate in one query", stats.projects === projects.length, stats);
  check("dashboard stats has lastUpdated", stats.lastUpdated instanceof Date, stats.lastUpdated);

  console.log("\nProject CRUD");
  const created = await svc.createProject({
    title: "Service Layer Smoke Test",
    slug: "service-layer-smoke-test",
    summary: "temporary",
    technologies: ["A", "B"],
    displayOrder: await svc.nextDisplayOrder(t.projects),
  });
  check("create returns a row with an id", created.id > 0, created.id);
  check("array column round-trips", created.technologies.join(",") === "A,B", created.technologies);
  check("jsonb default applied", Array.isArray(created.screenshots), created.screenshots);

  check("slug uniqueness detected", await svc.isSlugTaken("service-layer-smoke-test"));
  check(
    "slug uniqueness ignores self",
    !(await svc.isSlugTaken("service-layer-smoke-test", created.id)),
  );

  const updated = await svc.updateProject(created.id, {
    title: "Service Layer Smoke Test (edited)",
    screenshots: [{ url: "/x.png", caption: "shot" }],
  });
  check("update persists", updated?.title.endsWith("(edited)") === true, updated?.title);
  check(
    "jsonb write round-trips",
    updated?.screenshots[0]?.caption === "shot",
    updated?.screenshots,
  );
  check("updatedAt advances", (updated?.updatedAt.getTime() ?? 0) >= created.updatedAt.getTime());

  const byId = await svc.getProjectById(created.id);
  check("read back by id", byId?.id === created.id);

  console.log("\nWhiteboard");
  check("a new project has no whiteboard", created.whiteboard === null, created.whiteboard);

  // Submitted exactly as the admin form sends it: one hidden JSON field.
  const form = { title: "Smoke", category: "Web", screenshots: "" };
  const board = webAppWhiteboard();
  const accepted = projectSchema.safeParse({ ...form, whiteboard: JSON.stringify(board) });
  check("a valid board passes validation", accepted.success, !accepted.success && accepted.error);

  if (accepted.success) {
    const saved = await svc.updateProject(created.id, { whiteboard: accepted.data.whiteboard });
    check(
      "whiteboard round-trips through the database",
      saved?.whiteboard?.nodes.length === 3 && saved.whiteboard.edges[1]?.label === "queries",
      saved?.whiteboard,
    );
  }

  const cleared = projectSchema.safeParse({ ...form, whiteboard: "" });
  check("an empty field means no whiteboard", cleared.success && cleared.data.whiteboard === null);
  if (cleared.success) {
    const removed = await svc.updateProject(created.id, { whiteboard: cleared.data.whiteboard });
    check("removing a whiteboard clears the column", removed?.whiteboard === null);
  }

  const rejects = (label: string, value: unknown, expected: RegExp) => {
    const result = projectSchema.safeParse({ ...form, whiteboard: JSON.stringify(value) });
    const message = result.success ? "" : (fieldErrorsFrom(result.error).whiteboard ?? "");
    check(label, expected.test(message), message || "accepted");
  };
  rejects(
    "two boxes in one cell are rejected by name",
    { ...board, nodes: [...board.nodes, { ...board.nodes[0], id: "n9", label: "Cache" }] },
    /"Browser" and "Cache" are both in column 1, row 1/,
  );
  rejects(
    "an arrow to a missing box is rejected",
    { ...board, edges: [...board.edges, { from: "n1", to: "n42", label: "", dashed: false }] },
    /no longer exists/,
  );
  rejects(
    "a blank box label is rejected",
    { ...board, nodes: [{ ...board.nodes[0], label: "  " }, ...board.nodes.slice(1)] },
    /needs a label/,
  );
  rejects(
    "a board without boxes is rejected",
    { ...board, nodes: [], edges: [] },
    /at least one box/,
  );

  const sketch = sketchWhiteboard(board, "smoke");
  check(
    "sketches are deterministic for server and browser",
    JSON.stringify(sketch) === JSON.stringify(sketchWhiteboard(board, "smoke")),
  );
  // Browser → Database skips the API box that sits between them in the same row.
  const skipping = {
    ...board,
    edges: [...board.edges, { from: "n1", to: "n3", label: "", dashed: false }],
  };
  const routed = sketchWhiteboard(skipping, "smoke").strokes.filter(
    (stroke) => stroke.order === skipping.nodes.length + 2,
  )[0];
  const straight = sketchWhiteboard(skipping, "smoke").strokes.filter(
    (stroke) => stroke.order === skipping.nodes.length,
  )[0];
  const controlY = (d: string | undefined) => Number(/Q[-\d.]+,([-\d.]+)/.exec(d ?? "")?.[1]);
  const rowCentre = 26 + 124 / 2;
  check(
    "an arrow that would cross a box bows around it",
    controlY(routed?.d) < rowCentre - 40,
    routed?.d,
  );
  check(
    "an arrow between neighbours stays straight",
    Math.abs(controlY(straight?.d) - rowCentre) < 12,
    straight?.d,
  );

  check(
    "sketch again changes the hand, not the layout",
    sketch.strokes[0]?.d !== sketchWhiteboard(board, "smoke", 1).strokes[0]?.d &&
      sketch.width === sketchWhiteboard(board, "smoke", 1).width,
  );

  console.log("\nOrdering");
  const before = (await svc.listProjectsForAdmin()).map((p) => p.id);
  const moved = await svc.moveInOrder(t.projects, created.id, "up");
  const after = (await svc.listProjectsForAdmin()).map((p) => p.id);
  check("moveInOrder reports success", moved);
  check("order actually changed", before.join(",") !== after.join(","), { before, after });
  check("no rows lost while reordering", before.length === after.length);

  console.log("\nDelete");
  const deleted = await svc.deleteProject(created.id);
  check("delete returns the removed row", deleted?.id === created.id);
  check("row is gone", (await svc.getProjectById(created.id)) === null);
  check("delete of a missing row is a no-op", (await svc.deleteProject(created.id)) === null);

  console.log("\nCascade");
  const category = await svc.createSkillCategory({
    name: "Smoke Test Category",
    slug: "smoke-test-category",
    displayOrder: 999,
  });
  const skill = await svc.createSkill({ categoryId: category.id, name: "Temp Skill" });
  check("skill created under category", skill.categoryId === category.id);
  await svc.deleteSkillCategory(category.id);
  check("skills cascade-delete with their category", (await svc.getSkill(skill.id)) === null);

  /* Regression: renaming a category to a name whose slug is already taken used
     to be rejected on a hidden field, so the rename silently did nothing. The
     slug is internal, so it must be disambiguated rather than block the save. */
  console.log("\nCategory slug collisions");
  const first = await svc.createSkillCategory({
    name: "Collision Test",
    slug: "collision-test",
    displayOrder: 998,
  });
  const second = await svc.createSkillCategory({
    name: "Collision Test Other",
    slug: await svc.uniqueSkillCategorySlug("collision-test"),
    displayOrder: 999,
  });

  check(
    "a taken slug is disambiguated, not rejected",
    second.slug === "collision-test-2",
    second.slug,
  );
  check(
    "renaming onto a taken slug still succeeds",
    (
      await svc.updateSkillCategory(second.id, {
        name: "Collision Test",
        slug: await svc.uniqueSkillCategorySlug("collision-test", second.id),
      })
    )?.name === "Collision Test",
  );
  check(
    "a category keeps its own slug when renamed to the same name",
    (await svc.uniqueSkillCategorySlug("collision-test", first.id)) === "collision-test",
  );

  await svc.deleteSkillCategory(first.id);
  await svc.deleteSkillCategory(second.id);

  console.log(
    failures === 0
      ? "\nAll service-layer checks passed.\n"
      : `\n${failures} service-layer check(s) FAILED.\n`,
  );
}

main()
  .catch((error) => {
    console.error("Service check crashed:", error);
    failures += 1;
  })
  .finally(async () => {
    await sql.end();
    process.exit(failures === 0 ? 0 : 1);
  });
