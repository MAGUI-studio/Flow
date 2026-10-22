import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import vm from "node:vm";
import { resolve, extname } from "node:path";
import { existsSync } from "node:fs";

test("every admin page and mutation rejects anonymous and ordinary sessions before reading data or invoking provider mutations", async () => {
  // Compile the real entry points with identity/data adapters. No login is faked
  // in the running application, and no real account is modified by these tests.
  const files = [
    "page",
    "usuarios/page",
    "contas/page",
    "estabelecimentos/page",
    "assinaturas/page",
    "agendamentos/page",
    "auditoria/page",
    "usuarios/[id]/page",
    "usuarios/[id]/acessos/page",
    "usuarios/[id]/[section]/page",
    "usuarios/[id]/layout",
    "layout",
  ];
  const result = await build({
    stdin: {
      contents: `${files.map((file, i) => `import page${i} from './src/app/admin/${file}';`).join("\n")}\nimport {performAdminAction} from './src/app/admin/actions';\nimport {requireSuperAdmin} from './src/lib/admin';\nexport const pages=[${files.map((_, i) => `page${i}`).join(",")}]; export {performAdminAction,requireSuperAdmin};`,
      resolveDir: process.cwd(),
      loader: "ts",
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    write: false,
    tsconfigRaw: { compilerOptions: { jsx: "react-jsx", target: "ES2022" } },
    plugins: [
      {
        name: "admin-security-adapters",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^(server-only|@clerk\/nextjs\/server|next\/navigation|next\/cache)$/,
            },
            (args) => ({ path: args.path, namespace: "security-adapter" }),
          );
          builder.onLoad(
            { filter: /.*/, namespace: "security-adapter" },
            (args) => ({
              contents:
                args.path === "server-only"
                  ? ""
                  : args.path === "@clerk/nextjs/server"
                    ? `export async function auth(){return {userId:globalThis.fixture.userId}};export async function clerkClient(){return {users:{getUser:async()=>{if(globalThis.fixture.unavailable)throw Error('CLERK_UNAVAILABLE');return globalThis.fixture.user},banUser:async()=>{globalThis.fixture.mutations++},unbanUser:async()=>{globalThis.fixture.mutations++}}}}`
                    : args.path === "next/navigation"
                      ? `export function notFound(){throw Error('NOT_FOUND')} export function useRouter(){return {refresh(){}}} export function usePathname(){return '/admin'}`
                      : `export function revalidatePath(){globalThis.fixture.mutations++}`,
              loader: "js",
            }),
          );
          builder.onLoad(
            { filter: /[/\\]src[/\\]lib[/\\](prisma|db)\.ts$/ },
            () => ({
              contents: `export function prisma(){globalThis.fixture.reads++;throw Error('UNAUTHORIZED_DATA_READ')} export const db=prisma;`,
              loader: "js",
            }),
          );
          builder.onResolve({ filter: /.*/ }, (args) => {
            if (!args.path.startsWith(".") && !args.path.startsWith("@/"))
              return { path: args.path, external: true };
            const base = args.path.startsWith("@/")
              ? resolve(process.cwd(), "src", args.path.slice(2))
              : resolve(args.resolveDir, args.path);
            const file = extname(base)
              ? base
              : [".ts", ".tsx", ".js"]
                  .map((ext) => base + ext)
                  .find(existsSync);
            if (!file)
              throw new Error(`Unresolved test dependency: ${args.path}`);
            return { path: file };
          });
        },
      },
    ],
  });
  const fixture = {
    userId: null as string | null,
    user: null as unknown,
    unavailable: false,
    reads: 0,
    mutations: 0,
  };
  const module = {
    exports: {} as {
      pages: ((props: unknown) => Promise<unknown>)[];
      performAdminAction: (
        input: unknown,
      ) => Promise<{ ok: boolean; error?: string }>;
      requireSuperAdmin: () => Promise<{ id: string }>;
    },
  };
  vm.runInNewContext(result.outputFiles[0].text, {
    module,
    exports: module.exports,
    require: createRequire(import.meta.url),
    fixture,
    console: { ...console, error() {} },
    process,
    Buffer,
    setTimeout,
    clearTimeout,
  });
  const user = {
    id: "user_customer",
    primaryEmailAddressId: "primary",
    emailAddresses: [
      {
        id: "primary",
        emailAddress: "customer@example.com",
        verification: { status: "verified" },
      },
      {
        id: "secondary",
        emailAddress: "guibus.dev@gmail.com",
        verification: { status: "verified" },
      },
    ],
    publicMetadata: { role: "SUPERADMIN" },
    unsafeMetadata: { role: "SUPERADMIN" },
  };
  for (const anonymous of [true, false]) {
    fixture.userId = anonymous ? null : user.id;
    fixture.user = user;
    for (const page of module.exports.pages)
      await assert.rejects(
        page({
          params: Promise.resolve({ id: "user_target", section: "anotacoes" }),
          searchParams: Promise.resolve({}),
          children: null,
        }),
        /NOT_FOUND/,
      );
    for (const action of ["ban", "unban", "hide", "publish"]) {
      const result = await module.exports.performAdminAction({
        action,
        target: "user_target",
        confirmed: true,
        reason: "Motivo de teste válido",
      });
      assert.equal(result.ok, false);
      assert.equal(result.error, "Acesso não autorizado.");
    }
    assert.equal(fixture.reads, 0);
    assert.equal(fixture.mutations, 0);
  }
  fixture.userId = "user_admin";
  fixture.user = {
    ...user,
    id: "user_admin",
    emailAddresses: [
      {
        id: "primary",
        emailAddress: "guibus.dev@gmail.com",
        verification: { status: "verified" },
      },
    ],
  };
  assert.equal((await module.exports.requireSuperAdmin()).id, "user_admin");
  const selfBlock = await module.exports.performAdminAction({
    action: "ban",
    target: "user_admin",
    confirmed: true,
    reason: "Tentativa de bloquear a própria conta",
  });
  assert.equal(selfBlock.ok, false);
  assert.match(selfBlock.error ?? "", /SUPERADMIN/);
  assert.equal(fixture.reads, 0);
  assert.equal(fixture.mutations, 0);
  fixture.unavailable = true;
  await assert.rejects(module.exports.requireSuperAdmin(), /CLERK_UNAVAILABLE/);
  const unavailable = await module.exports.performAdminAction({
    action: "ban",
    target: "user_target",
    confirmed: true,
    reason: "Motivo de teste válido",
  });
  assert.equal(unavailable.ok, false);
  assert.equal(fixture.mutations, 0);
  assert.equal(fixture.reads, 0);
});
