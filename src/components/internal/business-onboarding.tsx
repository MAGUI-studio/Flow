import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeading } from "./primitives";
export function BusinessOnboarding({
  title = "Seu negócio começa aqui.",
}: {
  title?: string;
}) {
  return (
    <>
      <PageHeading
        eyebrow="BEM-VINDO AO FLOW"
        title={title}
        description="Transforme seu talento em uma agenda organizada. Vamos começar pelo seu espaço."
      />
      <div className="onboarding-hero">
        <div>
          <span className="internal-eyebrow">O PRIMEIRO PASSO É SIMPLES</span>
          <h2>
            Um espaço seu.
            <br />
            Mais tempo para crescer.
          </h2>
          <p>
            Crie sua página, apresente sua equipe e deixe os agendamentos
            fluírem.
          </p>
          <Link href="/painel/estabelecimentos/novo" className="button">
            <Plus size={16} />
            Criar meu estabelecimento
          </Link>
        </div>
        <span aria-hidden="true" className="onboarding-flower">✳</span>
      </div>
      <div className="setup-explainer">
        {[
          [
            "01",
            "Seu estabelecimento",
            "Nome, contato e o seu jeito de atender.",
          ],
          ["02", "Equipe e serviços", "Quem atende e o que você oferece."],
          [
            "03",
            "Sua agenda aberta",
            "Configure horários e publique quando estiver tudo pronto.",
          ],
        ].map(([n, title, description]) => (
          <div key={n}>
            <span>{n}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
