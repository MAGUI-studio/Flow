"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { FlowSelect } from "@/components/ui/flow-select";
import { FlowDate } from "@/components/ui/flow-date";
import { FlowTime } from "@/components/ui/flow-time";
import { useRouter } from "next/navigation";
import { money, statusLabel, hourLabel } from "@/lib/format";
export type ManagedBusiness = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  professionals: { id: string; name: string }[];
  services: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
    kind: string;
    professionals: { professionalId: string }[];
  }[];
  windows: {
    id: string;
    professionalId: string;
    startsAt: string;
    endsAt: string;
  }[];
  bookings: {
    id: string;
    status: string;
    startsAt: string;
    serviceName: string;
    professionalName: string;
    whatsapp: string | null;
  }[];
};
export function Manager({
  businesses,
  plan,
}: {
  businesses: ManagedBusiness[];
  plan: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(businesses[0]?.id ?? "new"),
    [tab, setTab] = useState("agenda"),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  const b = businesses.find((e) => e.id === selected);
  async function submit(event: FormEvent<HTMLFormElement>, type: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const input: Record<string, unknown> = Object.fromEntries(fields);
    input.type = type;
    input.establishmentId = b?.id;
    if (type === "service") {
      input.professionalIds = fields.getAll("professionalIds");
      input.priceCents = Math.round(Number(fields.get("price")) * 100);
    }
    if (type === "availability") input.block = fields.get("block") === "on";
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const r = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      form.reset();
      setSuccess("Salvo com sucesso.");
      if (type === "establishment") {
        setSelected(data.id);
        setTab("equipe");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function action(id: string, action: string) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível alterar.");
    } finally {
      setBusy(false);
    }
  }
  const professionalSelect = (
    <label className="form-field">
      Profissional
      <FlowSelect name="professionalId" required disabled={!b?.professionals.length}>
        <option value="">Selecione</option>
        {b?.professionals.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </FlowSelect>
    </label>
  );
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <label className="form-field">
          Estabelecimento
          <FlowSelect
            value={selected}
            onValueChange={(value) => {
              setSelected(value);
              setError("");
              setSuccess("");
            }}
          >
            {businesses.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
            <option value="new">+ Novo estabelecimento</option>
          </FlowSelect>
        </label>
        {[
          ["agenda", "Agenda"],
          ["equipe", "Profissionais"],
          ["servicos", "Serviços"],
          ["horarios", "Disponibilidade"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setTab(id);
              setError("");
              setSuccess("");
            }}
          >
            {label}
          </button>
        ))}
        <Link href="/planos">Minha assinatura</Link>
        <Link href="/agendamentos">Meus agendamentos</Link>
      </aside>
      <section key={selected}>
        <div className="eyebrow" style={{ justifyContent: "flex-start" }}>
          PLANO {plan === "multi" ? "EXPANDIR" : "ESSENCIAL"}
        </div>
        <h1 style={{ fontSize: 34 }}>
          {b?.name ?? "Seu negócio começa aqui."}
        </h1>
        {b && (
          <Link className="back-link" href={`/${b.slug}`} target="_blank">
            Abrir minha página ↗
          </Link>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="notice" role="status">
            {success}
          </p>
        )}
        {!b ? (
          <form className="panel" onSubmit={(e) => submit(e, "establishment")}>
            <h2>Cadastrar estabelecimento</h2>
            <label className="form-field">
              Nome
              <input name="name" required maxLength={150} />
            </label>
            <label className="form-field">
              Endereço da sua página
              <input
                name="slug"
                placeholder="meu-estabelecimento"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                minLength={3}
                maxLength={70}
              />
              <small className="muted-text">
                flow.magui.studio/seu-endereco
              </small>
            </label>
            <label className="form-field">
              Categoria
              <FlowSelect name="category">
                {[
                  "Beleza",
                  "Barbearia",
                  "Saúde",
                  "Bem-estar",
                  "Educação",
                  "Consultoria",
                  "Outros",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </FlowSelect>
            </label>
            <label className="form-field">
              Descrição
              <textarea name="description" maxLength={1000} />
            </label>
            <div className="fields-grid">
              <label className="form-field">
                Cidade / UF
                <input name="city" placeholder="São Paulo, SP" />
              </label>
              <label className="form-field">
                WhatsApp de contato
                <input name="contactPhone" type="tel" />
              </label>
            </div>
            <label className="form-field">
              Endereço
              <input name="address" maxLength={300} />
            </label>
            <div className="fields-grid">
              <label className="form-field">
                Confirmação
                <FlowSelect name="approvalMode">
                  <option value="automatic">Automática</option>
                  <option value="manual">Aprovação manual</option>
                </FlowSelect>
              </label>
              <label className="form-field">
                Antecedência para cancelar (horas)
                <input
                  name="cancelNoticeHours"
                  type="number"
                  min={0}
                  max={720}
                  defaultValue={2}
                />
              </label>
            </div>
            <button className="button full" disabled={busy}>
              Cadastrar estabelecimento
            </button>
          </form>
        ) : tab === "equipe" ? (
          <div className="panel">
            <h2>Sua equipe</h2>
            {b.professionals.map((p) => (
              <div className="choice" key={p.id}>
                <strong>{p.name}</strong>
                <span className="badge">Ativo</span>
              </div>
            ))}
            {!b.professionals.length && (
              <p className="muted-text">
                Cadastre quem realiza os atendimentos.
              </p>
            )}
            <form onSubmit={(e) => submit(e, "professional")}>
              <label className="form-field">
                Nome do profissional
                <input name="name" required maxLength={150} />
              </label>
              <button
                className="button"
                disabled={busy || b.professionals.length >= 10}
              >
                Adicionar profissional
              </button>
              <small className="muted-text">
                {b.professionals.length} de 10 profissionais
              </small>
            </form>
          </div>
        ) : tab === "servicos" ? (
          <div className="panel">
            <h2>Serviços</h2>
            {b.services.map((s) => (
              <div className="choice" key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  <small>
                    {s.durationMinutes} min ·{" "}
                    {s.kind === "collective" ? "Em grupo" : "Individual"}
                  </small>
                </div>
                <strong>{money(s.priceCents)}</strong>
              </div>
            ))}
            <form onSubmit={(e) => submit(e, "service")}>
              <h3>Novo serviço</h3>
              <label className="form-field">
                Nome
                <input name="name" required maxLength={150} />
              </label>
              <div className="fields-grid">
                <label className="form-field">
                  Duração (minutos)
                  <input
                    name="durationMinutes"
                    type="number"
                    min={5}
                    max={1440}
                    defaultValue={30}
                    required
                  />
                </label>
                <label className="form-field">
                  Valor (R$) · zero para gratuito
                  <input
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={0}
                    required
                  />
                </label>
                <label className="form-field">
                  Intervalo entre horários (minutos)
                  <input
                    name="stepMinutes"
                    type="number"
                    min={5}
                    defaultValue={30}
                    required
                  />
                </label>
                <label className="form-field">
                  Modalidade
                  <FlowSelect name="modality">
                    <option value="in_person">Presencial</option>
                    <option value="online">Online</option>
                  </FlowSelect>
                </label>
                <label className="form-field">
                  Formato
                  <FlowSelect name="kind">
                    <option value="individual">Individual</option>
                    <option value="collective">Coletivo</option>
                  </FlowSelect>
                </label>
                <label className="form-field">
                  Preparação antes / depois (minutos)
                  <div className="fields-grid">
                    <input
                      name="bufferBefore"
                      aria-label="Preparação antes"
                      type="number"
                      min={0}
                      max={240}
                      defaultValue={0}
                    />
                    <input
                      name="bufferAfter"
                      aria-label="Preparação depois"
                      type="number"
                      min={0}
                      max={240}
                      defaultValue={0}
                    />
                  </div>
                </label>
              </div>
              <h3>Quem atende este serviço?</h3>
              {b.professionals.map((p) => (
                <label className="checkbox-field" key={p.id}>
                  <input name="professionalIds" value={p.id} type="checkbox" />
                  {p.name}
                </label>
              ))}
              <button
                className="button full"
                disabled={busy || !b.professionals.length}
              >
                Cadastrar serviço
              </button>
            </form>
          </div>
        ) : tab === "horarios" ? (
          <>
            <form className="panel" onSubmit={(e) => submit(e, "availability")}>
              <h2>Abrir ou bloquear horários</h2>
              <p className="muted-text">
                Abra as datas que deseja atender. Para pausas, crie janelas
                separadas ou adicione um bloqueio.
              </p>
              {professionalSelect}
              <div className="fields-grid">
                <label className="form-field">
                  Data
                  <FlowDate name="date" required />
                </label>
                <label className="form-field">
                  Das
                  <FlowTime name="start" required />
                </label>
                <label className="form-field">
                  Até
                  <FlowTime name="end" required />
                </label>
              </div>
              <label className="checkbox-field">
                <input type="checkbox" name="block" />
                Bloquear este período
              </label>
              <button className="button" disabled={busy}>
                Salvar período
              </button>
              <p className="muted-text">Fuso horário: {b.timezone}</p>
            </form>
            <div className="panel" style={{ marginTop: 20 }}>
              <h2>Próximos períodos abertos</h2>
              {b.windows.slice(0, 20).map((w) => (
                <div className="table-row" key={w.id}>
                  <span>
                    {
                      b.professionals.find((p) => p.id === w.professionalId)
                        ?.name
                    }
                  </span>
                  <span>
                    {new Date(w.startsAt).toLocaleDateString("pt-BR", {
                      timeZone: b.timezone,
                    })}
                  </span>
                  <span>
                    {hourLabel(w.startsAt, b.timezone)} –{" "}
                    {hourLabel(w.endsAt, b.timezone)}
                  </span>
                </div>
              ))}
            </div>
            {b.services.some((s) => s.kind === "collective") && (
              <form
                className="panel"
                style={{ marginTop: 20 }}
                onSubmit={(e) => submit(e, "session")}
              >
                <h2>Criar sessão coletiva</h2>
                <label className="form-field">
                  Serviço
                  <FlowSelect name="serviceId" required>
                    <option value="">Selecione</option>
                    {b.services
                      .filter((s) => s.kind === "collective")
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </FlowSelect>
                </label>
                {professionalSelect}
                <div className="fields-grid">
                  <label className="form-field">
                    Data
                    <FlowDate name="date" required />
                  </label>
                  <label className="form-field">
                    Início
                    <FlowTime name="start" required />
                  </label>
                  <label className="form-field">
                    Vagas
                    <input
                      name="capacity"
                      type="number"
                      min={1}
                      max={1000}
                      required
                      defaultValue={10}
                    />
                  </label>
                </div>
                <button className="button" disabled={busy}>
                  Criar sessão
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="panel">
            <h2>Agendamentos</h2>
            {!b.bookings.length && (
              <p className="muted-text">
                Seus agendamentos aparecerão aqui. Cadastre os serviços e abra a
                agenda para começar a receber clientes.
              </p>
            )}
            {b.bookings.map((a) => (
              <article className="booking-record" key={a.id}>
                <div>
                  <strong>{a.serviceName}</strong>
                  <p className="muted-text">
                    {a.professionalName} ·{" "}
                    {new Date(a.startsAt).toLocaleString("pt-BR", {
                      timeZone: b.timezone,
                    })}
                  </p>
                  {a.whatsapp && (
                    <p className="muted-text">WhatsApp: {a.whatsapp}</p>
                  )}
                  <span className="badge">{statusLabel[a.status]}</span>
                </div>
                <div className="record-actions">
                  {a.status === "pending" && (
                    <>
                      <button
                        className="button small"
                        disabled={busy}
                        onClick={() => action(a.id, "approve")}
                      >
                        Aprovar
                      </button>
                      <button
                        className="button secondary small"
                        disabled={busy}
                        onClick={() => action(a.id, "decline")}
                      >
                        Recusar
                      </button>
                    </>
                  )}
                  {a.status === "confirmed" && (
                    <button
                      className="button secondary small"
                      disabled={busy}
                      onClick={() => action(a.id, "complete")}
                    >
                      Concluir
                    </button>
                  )}
                  {["pending", "confirmed"].includes(a.status) && (
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => action(a.id, "cancel")}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
