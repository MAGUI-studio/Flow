import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { Client } from "pg";
const local = parse(readFileSync(".env.neon-backup"));
const homolog = parse(readFileSync(".env.homolog"));
const sourceUrl = new URL(local.DATABASE_URL);
const targetUrl = new URL(homolog.DIRECT_DATABASE_URL);
if (
  !["localhost", "127.0.0.1"].includes(sourceUrl.hostname) ||
  !targetUrl.hostname.endsWith(".neon.tech") ||
  !process.argv.includes("--confirm-copy")
)
  throw new Error("Exige origem local, destino Neon e --confirm-copy.");
const source = new Client({ connectionString: sourceUrl.toString() });
const target = new Client({ connectionString: targetUrl.toString() });
const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"';
try {
  await source.connect();
  await target.connect();
  await source.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  await target.query("BEGIN");
  const tables: string[] = (
    await source.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations' ORDER BY tablename",
    )
  ).rows.map((row) => row.tablename);
  const deps = (
    await source.query(
      "SELECT c.relname AS child,p.relname AS parent FROM pg_constraint f JOIN pg_class c ON c.oid=f.conrelid JOIN pg_class p ON p.oid=f.confrelid WHERE f.contype='f' AND c.relnamespace='public'::regnamespace AND c.oid<>p.oid",
    )
  ).rows;
  const sorted: string[] = [];
  while (sorted.length < tables.length) {
    const next = tables.find(
      (table) =>
        !sorted.includes(table) &&
        deps
          .filter((dep) => dep.child === table)
          .every((dep) => sorted.includes(dep.parent)),
    );
    if (!next) throw new Error("Dependências circulares: cópia interrompida.");
    sorted.push(next);
  }
  for (const table of sorted) {
    await target.query(
      `LOCK TABLE public.${quote(table)} IN ACCESS EXCLUSIVE MODE`,
    );
    const { rows } = await target.query(
      `SELECT count(*)::int AS count FROM public.${quote(table)}`,
    );
    if (rows[0].count)
      throw new Error(`Destino não vazio: ${table}. Nenhum dado sobrescrito.`);
  }
  let total = 0;
  for (const table of sorted) {
    const data = (
      await source.query(
        `SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text AS data FROM public.${quote(table)} t`,
      )
    ).rows[0].data;
    const inserted = await target.query(
      `INSERT INTO public.${quote(table)} OVERRIDING SYSTEM VALUE SELECT * FROM json_populate_recordset(NULL::public.${quote(table)}, $1::json)`,
      [data],
    );
    const original = JSON.parse(data).length;
    if (inserted.rowCount !== original)
      throw new Error(`Contagem inconsistente: ${table}`);
    const sourceHash = (
      await source.query(
        `SELECT md5(COALESCE(string_agg(row_to_json(t)::text, E'\n' ORDER BY row_to_json(t)::text),'')) AS hash FROM public.${quote(table)} t`,
      )
    ).rows[0].hash;
    const targetHash = (
      await target.query(
        `SELECT md5(COALESCE(string_agg(row_to_json(t)::text, E'\n' ORDER BY row_to_json(t)::text),'')) AS hash FROM public.${quote(table)} t`,
      )
    ).rows[0].hash;
    if (sourceHash !== targetHash)
      throw new Error(`Conteúdo inconsistente: ${table}`);
    total += original;
    console.log(`${table}: ${original} registros; conteúdo verificado`);
  }
  await target.query(
    "SELECT setval(pg_get_serial_sequence('audit_events','id'), COALESCE((SELECT max(id) FROM audit_events),1), EXISTS(SELECT 1 FROM audit_events))",
  );
  await target.query("COMMIT");
  await source.query("COMMIT");
  console.log(
    `Cópia concluída: ${sorted.length} tabelas, ${total} registros. Origem preservada.`,
  );
} catch (error) {
  await target.query("ROLLBACK").catch(() => {});
  await source.query("ROLLBACK").catch(() => {});
  console.error(
    error instanceof Error &&
      !/password|postgres(?:ql)?:\/\//i.test(error.message)
      ? error.message
      : "Falha na cópia. Nenhuma credencial exibida.",
  );
  process.exitCode = 1;
} finally {
  await source.end();
  await target.end();
}
