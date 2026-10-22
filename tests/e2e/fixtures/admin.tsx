import React from "react";
import { createRoot } from "react-dom/client";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { AdminShell } from "../../../src/components/admin/shell";
import { AdminDashboard } from "../../../src/components/admin/dashboard";
import {
  AdminHeading,
  AdminTable,
  AdminSubscriptionStatus,
  AdminPagination,
} from "../../../src/components/admin/primitives";
import { AdminSearch } from "../../../src/components/admin/search";
import { AdminRecordsTable } from "../../../src/components/admin/records-table";
import { AdminActionForm } from "../../../src/components/admin/action-form";
import { FlowToaster } from "../../../src/components/ui/flow-toaster";
import { adminEventLabel } from "../../../src/lib/admin-labels";
const userRows = [
  {
    id: "demo-ana",
    name: "Ana Ribeiro",
    email: "ana@exemplo.test",
    created: "22/10/2026, 09:40",
  },
  {
    id: "demo-bruno",
    name: "Bruno Oliveira",
    email: "bruno@exemplo.test",
    created: "21/10/2026, 15:25",
  },
  {
    id: "demo-carla",
    name: "Carla Santos",
    email: "carla@exemplo.test",
    created: "20/10/2026, 11:10",
  },
];
const page = window.location.pathname;
function Content() {
  if (page === "/admin")
    return (
      <AdminDashboard
        counts={[128, 116, 24, 18, 1432, 3]}
        recentUsers={userRows}
        recentEvents={[
          {
            id: "1",
            label: adminEventLabel("booking.reschedule_requested"),
            date: "22/10/2026, 10:30",
            business: "Studio Aurora",
          },
          {
            id: "2",
            label: adminEventLabel("booking.auto_completed"),
            date: "22/10/2026, 09:15",
            business: "Espaço Jardim",
          },
          {
            id: "3",
            label: adminEventLabel("business.published"),
            date: "21/10/2026, 17:40",
            business: "Ateliê Essência",
          },
        ]}
      />
    );
  if (page.includes("agendamentos"))
    return (
      <>
        <AdminHeading
          title="Agendamentos"
          description="Consulte os atendimentos de todos os negócios, clientes e profissionais da plataforma."
        />
        <AdminSearch filters={["status", "de", "ate", "ordem", "limite"]} />
        <AdminRecordsTable
          title="Agendamentos da plataforma"
          columns={["Estabelecimento", "Serviço", "Início", "Situação"]}
          records={[
            {
              id: "demo-reserva",
              fields: [
                ["Estabelecimento", "Studio Aurora"],
                ["Serviço", "Corte e finalização"],
                ["Início", "22/10/2026, 14:00"],
                ["Situação", "Confirmado"],
                ["Cliente", "Ana Ribeiro"],
                ["Preço", "R$ 85,00"],
              ],
            },
          ]}
        />
      </>
    );
  if (page.includes("estabelecimentos"))
    return (
      <>
        <AdminHeading
          title="Estabelecimentos"
          description="Gerencie a publicação dos negócios e acompanhe a estrutura de cada unidade."
        />
        <AdminSearch filters={["publicacao", "plano", "ordem", "limite"]} />
        <AdminTable
          title="Todos os estabelecimentos"
          headers={["Estabelecimento", "Cidade", "Situação", "Ações"]}
        >
          <tr>
            <td>
              <strong>Studio Aurora</strong>
            </td>
            <td>São Paulo</td>
            <td>Publicado</td>
            <td>
              <AdminActionForm
                target="00000000-0000-4000-8000-000000000001"
                action="hide"
                label="Retirar do ar"
              />
            </td>
          </tr>
        </AdminTable>
      </>
    );
  return (
    <>
      <AdminHeading
        title="Usuários"
        description="Consulte os cadastros, acompanhe os acessos e abra a ficha completa de cada pessoa."
      />
      <AdminSearch
        filters={["acesso", "plano", "de", "ate", "ordem", "limite"]}
      />
      <AdminTable
        title="Usuários cadastrados"
        headers={["Usuário", "Acesso", "Assinatura", "Atividade", "Cadastro"]}
      >
        {userRows.map((u, i) => (
          <tr key={u.id}>
            <td>
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F5F4FF] text-xs font-semibold text-[#635BFF]">
                  {u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <strong className="text-zinc-800">{u.name}</strong>
                  <p className="text-[11px] text-zinc-400">{u.email}</p>
                </div>
              </div>
            </td>
            <td>{i === 1 ? "Login bloqueado" : "Login liberado"}</td>
            <td>
              <p className="mb-1 font-medium text-zinc-700">
                {i === 0 ? "Flow PRO" : "Flow Essencial"}
              </p>
              <AdminSubscriptionStatus
                status={i === 1 ? "incomplete" : "active"}
              />
            </td>
            <td>
              {i + 1} negócios
              <br />
              {12 + i * 7} reservas
            </td>
            <td>{u.created}</td>
          </tr>
        ))}
      </AdminTable>
      <AdminPagination page={1} total={128} path="/admin/usuarios" />
    </>
  );
}
createRoot(document.getElementById("preview")!).render(
  <NuqsTestingAdapter
    hasMemory
    searchParams={window.location.search}
    onUrlUpdate={({ queryString }) =>
      history.replaceState(null, "", queryString || window.location.pathname)
    }
  >
    <FlowToaster />
    <AdminShell>
      <Content />
      <p className="mt-6 text-[10px] text-zinc-400">
        Prévia de interface · dados fictícios para testes
      </p>
    </AdminShell>
  </NuqsTestingAdapter>,
);
