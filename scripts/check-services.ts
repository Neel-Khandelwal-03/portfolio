import "./load-env";

import { sql } from "@/db";
import * as svc from "@/services/portfolio";
import * as t from "@/db/schema";

/**
 * Smoke test for the data-access layer: exercises read/create/update/delete and
 * the ordering helper against the real database, then cleans up after itself.
 *
 * Run with `npx tsx scripts/check-services.ts`.
 */

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
  check("jsonb write round-trips", updated?.screenshots[0]?.caption === "shot", updated?.screenshots);
  check(
    "updatedAt advances",
    (updated?.updatedAt.getTime() ?? 0) >= created.updatedAt.getTime(),
  );

  const byId = await svc.getProjectById(created.id);
  check("read back by id", byId?.id === created.id);

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
