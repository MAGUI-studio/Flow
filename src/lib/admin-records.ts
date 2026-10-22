// Fixed query definitions: user input is only ever passed as a SQL parameter.
export const adminRecordSections = {
  sessoes: {
    title: "Sessões e vagas",
    query: `SELECT s.id AS "ID", e.name AS "Estabelecimento", service.name AS "Serviço", p.name AS "Profissional", s.starts_at AS "Início", s.ends_at AS "Fim", s.occupied_start AS "Ocupação de", s.occupied_end AS "Ocupação até", s.capacity AS "Capacidade", s.active AS "Ativa" FROM sessions s JOIN establishments e ON e.id=s.establishment_id JOIN services service ON service.id=s.service_id JOIN professionals p ON p.id=s.professional_id WHERE e.owner_id=$1 ORDER BY s.starts_at DESC,s.id`,
  },
  arquivos: {
    title: "Imagens",
    query: `SELECT id AS "ID", 'Banner' AS "Tipo", url AS "URL", created_at AS "Enviada em" FROM business_banners WHERE owner_id=$1 UNION ALL SELECT id AS "ID", 'Foto de profissional' AS "Tipo", url AS "URL", created_at AS "Enviada em" FROM professional_photos WHERE owner_id=$1 ORDER BY "Enviada em" DESC,"ID"`,
  },
  historico: {
    title: "Histórico da conta",
    query: `SELECT a.id AS "ID", a.actor_id AS "Autor", a.action AS "Ação", a.establishment_id AS "Estabelecimento", a.booking_id AS "Reserva", a.created_at AS "Quando" FROM audit_events a WHERE a.actor_id=$1 OR EXISTS(SELECT 1 FROM establishments e WHERE e.id=a.establishment_id AND e.owner_id=$1) OR EXISTS(SELECT 1 FROM bookings b WHERE b.id=a.booking_id AND b.consumer_id=$1) ORDER BY a.created_at DESC,a.id DESC`,
  },
  estabelecimentos: {
    title: "Negócios",
    query: `SELECT e.id AS "ID", e.name AS "Nome", e.slug AS "Endereço público", e.category AS "Categoria", e.description AS "Descrição", e.timezone AS "Fuso", e.active AS "Ativo", e.published AS "Publicado", e.city AS "Cidade", e.address AS "Endereço", e.address_details AS "Endereço estruturado", e.contact_phone AS "Contato", e.website AS "Site", e.instagram AS "Instagram", e.approval_mode AS "Aprovação", e.cancel_notice_hours AS "Prazo de cancelamento (h)", e.logo_url AS "Logo", e.cover_url AS "Capa" FROM establishments e WHERE e.owner_id=$1 ORDER BY e.name, e.id`,
  },
  equipe: {
    title: "Equipe e horários",
    query: `SELECT p.id AS "ID", e.name AS "Estabelecimento", p.name AS "Profissional", p.active AS "Ativo", p.deleted_at AS "Excluído em", p.vacation_starts_at AS "Férias de", p.vacation_ends_at AS "Férias até", p.weekly_schedule AS "Agenda semanal", photo.url AS "Foto", (SELECT json_agg(json_build_object('início',w.starts_at,'fim',w.ends_at)) FROM availability_windows w WHERE w.professional_id=p.id) AS "Janelas por data", (SELECT json_agg(json_build_object('início',b.starts_at,'fim',b.ends_at,'motivo',b.reason)) FROM professional_blocks b WHERE b.professional_id=p.id) AS "Bloqueios individuais" FROM professionals p JOIN establishments e ON e.id=p.establishment_id LEFT JOIN professional_photos photo ON photo.id=p.photo_id WHERE e.owner_id=$1 ORDER BY e.name,p.name,p.id`,
  },
  servicos: {
    title: "Serviços",
    query: `SELECT s.id AS "ID", e.name AS "Estabelecimento", s.name AS "Serviço", s.active AS "Ativo", s.price_cents AS "Preço (centavos)", s.duration_minutes AS "Duração (min)", s.step_minutes AS "Cadência (min)", s.buffer_before AS "Intervalo antes", s.buffer_after AS "Intervalo depois", s.modality AS "Modalidade", s.kind AS "Tipo", (SELECT json_agg(p.name) FROM professional_services ps JOIN professionals p ON p.id=ps.professional_id WHERE ps.service_id=s.id) AS "Profissionais" FROM services s JOIN establishments e ON e.id=s.establishment_id WHERE e.owner_id=$1 ORDER BY e.name,s.name,s.id`,
  },
  agendamentos: {
    title: "Agendamentos",
    query: `SELECT b.id AS "ID", CASE WHEN b.consumer_id=$1 THEN 'Cliente' ELSE 'Responsável' END AS "Vínculo", e.name AS "Estabelecimento", s.name AS "Serviço", p.name AS "Profissional", b.consumer_id AS "ID do cliente", b.whatsapp AS "WhatsApp", session.starts_at AS "Início", session.ends_at AS "Fim", b.status AS "Status", b.purpose AS "Finalidade", b.price_cents AS "Preço (centavos)", b.duration_minutes AS "Duração (min)", b.created_at AS "Criado em", b.expires_at AS "Expira em", b.arrived_at AS "Chegada", b.attendance_at AS "Presença", b.completed_automatically AS "Conclusão automática", b.series_id AS "Série" FROM bookings b JOIN sessions session ON session.id=b.session_id JOIN establishments e ON e.id=session.establishment_id JOIN services s ON s.id=session.service_id JOIN professionals p ON p.id=session.professional_id WHERE b.consumer_id=$1 OR e.owner_id=$1 ORDER BY session.starts_at DESC,b.id`,
  },
  avaliacoes: {
    title: "Avaliações",
    query: `SELECT r.booking_id AS "Reserva", e.name AS "Estabelecimento", b.consumer_id AS "Cliente", r.establishment_score / 2.0 AS "Nota do espaço", r.professional_score / 2.0 AS "Nota do serviço", r.created_at AS "Enviada em" FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN sessions s ON s.id=b.session_id JOIN establishments e ON e.id=s.establishment_id WHERE b.consumer_id=$1 OR e.owner_id=$1 ORDER BY r.created_at DESC,r.booking_id`,
  },
  favoritos: {
    title: "Favoritos",
    query: `SELECT e.name AS "Estabelecimento", e.slug AS "Endereço público", f.created_at AS "Adicionado em" FROM favorites f JOIN establishments e ON e.id=f.establishment_id WHERE f.account_id=$1 ORDER BY f.created_at DESC,f.establishment_id`,
  },
  notificacoes: {
    title: "Notificações",
    query: `SELECT id AS "ID", title AS "Título", body AS "Mensagem", href AS "Destino", created_at AS "Criada em", read_at AS "Lida em" FROM notifications WHERE account_id=$1 ORDER BY created_at DESC,id`,
  },
  anotacoes: {
    title: "Anotações",
    query: `SELECT n.id AS "ID", e.name AS "Estabelecimento", n.consumer_id AS "Cliente", n.content AS "Anotação", n.created_at AS "Criada em", n.updated_at AS "Atualizada em" FROM customer_notes n JOIN establishments e ON e.id=n.establishment_id WHERE n.consumer_id=$1 OR e.owner_id=$1 ORDER BY n.updated_at DESC,n.id`,
  },
  espera: {
    title: "Lista de espera",
    query: `SELECT w.id AS "ID", e.name AS "Estabelecimento", s.name AS "Serviço", w.consumer_id AS "Cliente", w.phone AS "Telefone", w.status AS "Status", w.from_date AS "Data inicial", w.to_date AS "Data final", w.from_time AS "Hora inicial", w.to_time AS "Hora final", w.weekdays AS "Dias da semana", w.professional_id AS "Profissional", w.offered_booking_id AS "Oferta", w.offer_expires_at AS "Oferta expira em", w.created_at AS "Criada em" FROM waitlist_entries w JOIN services s ON s.id=w.service_id JOIN establishments e ON e.id=s.establishment_id WHERE w.consumer_id=$1 OR e.owner_id=$1 ORDER BY w.created_at DESC,w.id`,
  },
  recorrencias: {
    title: "Recorrências",
    query: `SELECT r.id AS "ID", e.name AS "Estabelecimento", r.consumer_id AS "Cliente", s.name AS "Serviço", p.name AS "Profissional", r.interval_weeks AS "Intervalo em semanas", r.created_at AS "Criada em" FROM booking_series r JOIN establishments e ON e.id=r.establishment_id JOIN services s ON s.id=r.service_id JOIN professionals p ON p.id=r.professional_id WHERE r.consumer_id=$1 OR e.owner_id=$1 ORDER BY r.created_at DESC,r.id`,
  },
  reagendamentos: {
    title: "Reagendamentos",
    query: `SELECT r.id AS "ID", r.booking_id AS "Reserva original", r.target_booking_id AS "Nova reserva", r.status AS "Status", r.expires_at AS "Prazo", r.created_at AS "Criado em" FROM reschedule_requests r JOIN bookings b ON b.id=r.booking_id JOIN sessions s ON s.id=b.session_id JOIN establishments e ON e.id=s.establishment_id WHERE b.consumer_id=$1 OR e.owner_id=$1 ORDER BY r.created_at DESC,r.id`,
  },
  bloqueios: {
    title: "Bloqueios de agenda",
    query: `SELECT b.id AS "ID", e.name AS "Estabelecimento", b.professional_ids AS "Profissionais", b.starts_at AS "Início", b.ends_at AS "Fim", b.reason AS "Motivo" FROM schedule_blocks b JOIN establishments e ON e.id=b.establishment_id WHERE e.owner_id=$1 ORDER BY b.starts_at DESC,b.id`,
  },
} as const;
