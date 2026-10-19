import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  Scissors,
  Layers,
  Palette,
  ChartNoAxesCombined,
} from "lucide-react";
export const businessNavigation = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard, group: "" },
  {
    href: "/painel/estabelecimentos",
    label: "Estabelecimentos",
    icon: Building2,
    group: "Configuração",
  },
  {
    href: "/painel/profissionais",
    label: "Profissionais",
    icon: Users,
    group: "Configuração",
  },
  {
    href: "/painel/servicos",
    label: "Serviços",
    icon: Scissors,
    group: "Configuração",
  },
  {
    href: "/painel/aparencia",
    label: "Aparência",
    icon: Palette,
    group: "Configuração",
  },
  {
    href: "/painel/sessoes",
    label: "Sessões em grupo",
    icon: Layers,
    group: "Atendimentos",
  },
  {
    href: "/painel/agenda",
    label: "Agenda",
    icon: CalendarDays,
    group: "Atendimentos",
  },
  {
    href: "/painel/relatorios",
    label: "Relatórios",
    icon: ChartNoAxesCombined,
    group: "Resultados",
  },
];
