import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Planos para seu negócio",
  "Conheça os planos Flow Essencial e Flow PRO para organizar equipe, serviços e agendamentos.",
  "/",
  true,
);
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/#planos");
}
