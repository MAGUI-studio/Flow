import {
  RocketLaunchIcon,
  CalendarSlashIcon,
  ArrowsClockwiseIcon,
  CalendarPlusIcon,
  AddressBookIcon,
} from "@phosphor-icons/react";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  Scissors,
  Layers,
  ChartNoAxesCombined,
} from "lucide-react";
export const businessNavigation = [
  {
    href: "/painel/configuracao",
    label: "Configurar negócio",
    icon: RocketLaunchIcon,
    group: "",
  },
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
    href: "/painel/bloqueios",
    label: "Bloqueios",
    icon: CalendarSlashIcon,
    group: "Atendimentos",
  },
  {
    href: "/painel/reagendamentos",
    label: "Reagendamentos",
    icon: ArrowsClockwiseIcon,
    group: "Atendimentos",
  },
  {
    href: "/painel/recorrencias",
    label: "Recorrências",
    icon: CalendarPlusIcon,
    group: "Atendimentos",
  },
  {
    href: "/painel/clientes",
    label: "Clientes",
    icon: AddressBookIcon,
    group: "Atendimentos",
  },
  {
    href: "/painel/relatorios",
    label: "Relatórios",
    icon: ChartNoAxesCombined,
    group: "Resultados",
  },
];
