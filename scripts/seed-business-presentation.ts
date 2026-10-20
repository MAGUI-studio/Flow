import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
config({ path: ".env.local", quiet: true });
if (process.env.NODE_ENV === "production" || !/^postgres(?:ql)?:\/\/[^@]+@(localhost|127\.0\.0\.1):5433\/flow(?:\?|$)/.test(process.env.DATABASE_URL ?? "")) throw new Error("Este script exige o banco local do Flow.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
// Seed contacts are intentionally synthetic; never replace owner-provided data.
const entries = [
  ["Ateliê Linha Fina", "atelielinhafina", "photo-1565058379802-bbe93b2f703a"],
  ["Barbearia Essência", "barbeariaessencia", "photo-1503951914875-452162b0f3f1"],
  ["Casa do Movimento", "casadomovimento", "photo-1518611012118-696072aa579a"],
  ["Clínica Viva", "clinicaviva", "photo-1629909613654-28e377c37b09"],
  ["Conecta Idiomas", "conectaidiomas", "photo-1503676260728-1c00da094a0b"],
  ["Espaço Horizonte", "espacohorizonte", "photo-1540555700478-4be289fbecef"],
  ["Flow Espaço Jardins", "flowespacojardins", "photo-1544161515-4ab6ce6db874"],
  ["Flow Estética Vila Mariana", "flowesteticavilamariana", "photo-1570172619644-dfd03ed5d881"],
  ["Flow Studio Centro", "flowstudiocentro", "photo-1560066984-138dadb4c035"],
  ["Movimento Yoga", "movimentoyoga", "photo-1544367567-0f2fcb009e0b"],
  ["Norte Consultoria", "norteconsultoria", "photo-1497366754035-f200968a6e72"],
  ["Studio Aurora", "studioaurora", "photo-1521590832167-7bcbfaa6381f"],
];
try {
  const rows = await db.establishment.findMany({ orderBy: { name: "asc" } });
  await db.$transaction(async tx => {
    for (const [index, row] of rows.entries()) {
      const entry = entries.find(([name]) => name === row.name);
      if (!entry) throw new Error(`Defina a apresentação de ${row.name} antes de executar.`);
      const [, handle, image] = entry;
      await tx.establishment.update({ where: { id: row.id }, data: {
        website: row.website || `https://${handle}.example.com`,
        instagram: row.instagram || `${handle}.flow`,
        contactPhone: row.contactPhone || `(11) 90000-${String(index + 1).padStart(4, "0")}`,
        coverUrl: row.coverUrl || `https://images.unsplash.com/${image}?auto=format&fit=crop&w=1600&h=600&q=85`,
      } });
    }
  });
  const incomplete = await db.establishment.count({ where: { OR: [{ website: null }, { instagram: null }, { contactPhone: null }, { coverUrl: null }] } });
  console.log(JSON.stringify({ updated: rows.length, incomplete, preservedExistingBanners: rows.filter(row => !!row.coverUrl).length }));
} finally { await db.$disconnect(); }
