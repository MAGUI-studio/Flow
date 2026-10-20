import { spawnSync } from "node:child_process";
const list = spawnSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], { encoding: "utf8" });
if (list.status !== 0) process.exit(list.status ?? 1);
const leaked = [];
const pattern = /\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{24,}\b|\bwhsec_[A-Za-z0-9]{24,}\b/;
for (const file of list.stdout.split("\0").filter(Boolean)) {
  const source = spawnSync("git", ["show", `:${file}`], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (source.status !== 0) { console.error(`Não foi possível revisar ${file}.`); process.exit(1); }
  if (pattern.test(source.stdout)) leaked.push(file);
}
if (leaked.length) { console.error(`Commit bloqueado: possíveis segredos Stripe nos arquivos: ${leaked.join(", ")}. Mova os valores para o ambiente local.`); process.exit(1); }
