import { test } from "node:test";
import assert from "node:assert/strict";
import { adminFilterDefaults, adminFilterSchema, readAdminFilters, adminDateRange } from "../src/lib/admin-filters";
import { adminEventLabel, adminEventDescription, adminFieldValue, adminRecordFields } from "../src/lib/admin-labels";
import { buildAdminRecordQuery, adminSearchTerms } from "../src/lib/admin-record-filters";
import { adminRecordSections } from "../src/lib/admin-records";

test("admin filters validate date ranges, retain URL choices and use São Paulo day boundaries", () => {
  const filters = readAdminFilters({ busca: " Ana ", status: "past_due", plano: "multi", de: "2026-10-01", ate: "2026-10-22", limite: "50" });
  assert.equal(filters.busca, "Ana");assert.equal(filters.status,"past_due");assert.equal(filters.plano,"multi");assert.equal(filters.limite,"50");
  assert.equal(adminDateRange(filters).gte?.toISOString(),"2026-10-01T03:00:00.000Z");
  assert.equal(adminDateRange(filters).lt?.toISOString(),"2026-10-23T03:00:00.000Z");
  for (const override of [{de:"2026-02-31"},{de:"2026-10-23",ate:"2026-10-22"},{plano:"injected"},{limite:"5000"}]) assert.equal(adminFilterSchema.safeParse({...adminFilterDefaults,...override}).success,false);
});
test("administrative statuses and audit events are shown in Portuguese, preserving free text", () => {
  assert.equal(adminEventLabel("booking.auto_completed"),"Atendimento concluído automaticamente");
  assert.equal(adminEventLabel("booking.reschedule_requested"),"Reagendamento solicitado");
  assert.equal(adminEventLabel("admin.user.view.anotacoes:user_example"),"Consulta de anotações");
  assert.equal(adminEventLabel("stripe:charge.refunded:evt_example:ch_example"),"Pagamento reembolsado");
  assert.match(adminEventDescription("admin.ban:user_example:Solicitação do suporte"),/Motivo: Solicitação do suporte/);
  assert.equal(adminFieldValue("Status","incomplete"),"Pagamento pendente");
  assert.equal(adminFieldValue("Status","active"),"Ativo");
  assert.equal(adminFieldValue("Modalidade","in_person"),"Presencial");
  assert.equal(adminFieldValue("Anotação","active"),"active");
  assert.equal(adminRecordFields({"Preço (centavos)":4990})[0][0],"Preço");
  assert.match(adminFieldValue("Agenda semanal",{days:[{weekday:1,enabled:true,intervals:[{start:"09:00",end:"18:00"}]}]}),/Segunda-feira: 09:00 às 18:00/);
  assert.ok(adminSearchTerms("reagendamento solicitado").includes("booking.reschedule_requested"));
});
test("record filters bind search, identity, dates and limits instead of interpolating input", () => {
  const search="' OR 1=1 --%_";
  const built=buildAdminRecordQuery(adminRecordSections.agendamentos.query,"agendamentos","user_example",{...adminFilterDefaults,busca:search,status:"confirmed",de:"2026-10-01",ate:"2026-10-22",limite:"50"},2);
  assert.equal(built.sql.includes(search),false);
  assert.equal(built.values[0],"user_example");
  assert.equal(built.values.at(-1),50);
  assert.equal(built.values.at(-2),50);
  assert.equal(built.count.includes("LIMIT"),false);
  assert.ok(built.values.includes("confirmed"));
});
