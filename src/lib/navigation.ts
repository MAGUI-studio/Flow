import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  Scissors,
  Clock,
  Layers,
  Palette,
  ChartNoAxesCombined,
} from "lucide-react";
export const businessNavigation = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
  {
    href: "/painel/estabelecimentos",
    label: "Estabelecimentos",
    icon: Building2,
  },
  { href: "/painel/profissionais", label: "Profissionais", icon: Users },
  { href: "/painel/servicos", label: "Serviços", icon: Scissors },
  { href: "/painel/disponibilidade", label: "Disponibilidade", icon: Clock },
  { href: "/painel/sessoes", label: "Sessões em grupo", icon: Layers },
  { href: "/painel/aparencia", label: "Aparência", icon: Palette },
  {
    href: "/painel/relatorios",
    label: "Relatórios",
    icon: ChartNoAxesCombined,
  },
];
