export function planFeatures(plan: string) {
  return plan === "multi"
    ? {
        name: "Flow PRO",
        establishments: 3,
        professionals: 20,
        reports: true,
        export: true,
      }
    : {
        name: "Essencial",
        establishments: 1,
        professionals: 10,
        reports: false,
        export: false,
      };
}
export const templates = [
  {
    id: "flow",
    name: "Flow",
    description: "Capa ampla e uma apresentação acolhedora.",
    pro: false,
    color: "#e5dff0",
  },
  {
    id: "minimal",
    name: "Essência",
    description: "Uma apresentação compacta, limpa e direta.",
    pro: false,
    color: "#e5e7eb",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Tipografia expressiva e detalhes em tons naturais.",
    pro: true,
    color: "#ede5d9",
  },
  {
    id: "night",
    name: "Noturno",
    description: "Capa escura e uma identidade marcante.",
    pro: true,
    color: "#18181b",
  },
] as const;
export type TemplateId = (typeof templates)[number]["id"];
export function allowedTemplate(id: string, plan: string) {
  return templates.some(
    (template) => template.id === id && (!template.pro || plan === "multi"),
  );
}
export function effectiveTemplate(id: string, plan: string): TemplateId {
  return allowedTemplate(id, plan) ? (id as TemplateId) : "flow";
}
