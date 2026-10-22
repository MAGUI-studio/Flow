import Link from "next/link";
import {
  LegalPage,
  LegalContact,
  type LegalSection,
} from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Termos de Uso",
  "Conheça as condições para usar o Flow, agendar serviços e gerenciar a assinatura do seu negócio.",
  "/termos",
);

const sections: LegalSection[] = [
  {
    id: "sobre",
    title: "O Flow e estes termos",
    content: (
      <>
        <LegalContact />
        <p>
          O Flow conecta quem quer agendar um serviço a quem oferece o
          atendimento. Clientes podem encontrar espaços e acompanhar suas
          reservas; responsáveis por negócios podem organizar equipe, serviços e
          horários. Estes termos explicam os compromissos de cada parte.
          Consulte também nossa{" "}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
        <p>
          Estas condições se aplicam à criação de conta, às reservas e à
          contratação de planos. Leia o documento antes de continuar e, se
          precisar de algum esclarecimento, fale com a gente pelo e-mail acima.
        </p>
      </>
    ),
  },
  {
    id: "conta",
    title: "Conta e acesso",
    content: (
      <>
        <p>
          Você entra no Flow com sua conta Google. Mantenha suas informações
          atualizadas e proteja o acesso à conta: suas credenciais são pessoais
          e não devem ser compartilhadas. Se perceber um acesso que não
          reconhece, proteja sua conta Google e avise nosso suporte.
        </p>
        <p>
          Você deve ter capacidade legal para realizar os atos pretendidos.
          Quando necessário, o uso e a contratação devem ocorrer com a
          participação de seu representante legal. O responsável pelo negócio
          deve ter autorização para representá-lo e cadastrar sua equipe.
        </p>
      </>
    ),
  },
  {
    id: "agendamentos",
    title: "Reservas e atendimentos",
    content: (
      <>
        <p>
          Disponibilidade, duração, preço, modalidade e profissional são
          apresentados durante o agendamento. O horário é revalidado ao
          confirmar e pode deixar de estar disponível enquanto você faz sua
          escolha.
        </p>
        <p>
          Se o estabelecimento trabalhar com aprovação manual, o pedido ficará
          pendente até a decisão do responsável. Considere o atendimento
          reservado quando o status aparecer como confirmado. Pedidos pendentes
          e ofertas da lista de espera têm prazo de validade, informado na
          plataforma.
        </p>
        <p>
          O estabelecimento é responsável pela prestação do serviço,
          qualificação dos profissionais, informações divulgadas e condições de
          atendimento. O Flow é responsável pelo funcionamento da plataforma,
          nos limites de suas obrigações legais. O pagamento do atendimento é
          combinado com o estabelecimento; a cobrança de assinatura do Flow é
          separada.
        </p>
        <p>
          Acompanhe confirmações e mudanças pela área de agendamentos e pelas
          notificações do Flow. Os avisos desta versão são exibidos dentro da
          plataforma, sem envio automático por e-mail ou WhatsApp. Em serviços
          online, seu WhatsApp pode ser necessário para o estabelecimento
          combinar os detalhes do atendimento.
        </p>
      </>
    ),
  },
  {
    id: "cancelamentos",
    title: "Cancelamento e reagendamento",
    content: (
      <>
        <p>
          Antes de confirmar, confira o prazo de cancelamento definido pelo
          estabelecimento. Para cancelar ou pedir outro horário, acesse sua área
          de agendamentos e utilize as opções disponíveis para a reserva. O
          reagendamento pode depender de aprovação: acompanhe o status para
          saber quando a mudança foi concluída.
        </p>
        <p>
          Para alterações fora do prazo, divergências de atendimento ou eventual
          devolução de valores pagos pelo serviço, fale diretamente com o
          estabelecimento. As regras do negócio não afastam direitos assegurados
          pela legislação aplicável.
        </p>
      </>
    ),
  },
  {
    id: "assinaturas",
    title: "Planos, teste e cobrança",
    content: (
      <>
        <h3 className="text-sm text-zinc-900">Antes de contratar</h3>
        <p>
          Os planos pagos são destinados aos responsáveis pelos negócios. Os
          preços, limites de unidades, equipe e recursos são apresentados na{" "}
          <Link href="/#planos">comparação de planos</Link> e no momento da
          contratação. O pagamento da assinatura é processado pelo Stripe.
        </p>
        <p>
          Quando oferecido, o período de teste de 7 dias vale para a primeira
          assinatura elegível. Após o teste, a cobrança mensal começa conforme
          as condições exibidas no checkout, salvo cancelamento antes do
          término. Confira valor, data da próxima cobrança e condições antes de
          concluir.
        </p>
        <h3 className="pt-2 text-sm text-zinc-900">
          Renovação e mudanças de plano
        </h3>
        <p>
          A assinatura é renovada automaticamente até o cancelamento. Gerencie
          pagamentos e cancelamento na{" "}
          <Link href="/assinatura">área de assinatura</Link>. O encerramento ao
          final do período mantém o acesso até a data informada. Falha de
          pagamento, vencimento ou encerramento podem restringir o painel e a
          disponibilidade pública do negócio.
        </p>
        <p>
          Mudanças de plano podem envolver ajuste proporcional, informado antes
          da confirmação. Um downgrade pode ser bloqueado enquanto o cadastro
          exceder os limites do plano de destino. Alterações de preço de uma
          assinatura vigente serão comunicadas antes de sua aplicação.
        </p>
        <h3 className="pt-2 text-sm text-zinc-900">Cancelamento e reembolso</h3>
        <p>
          Os pagamentos e eventuais reembolsos da assinatura são processados
          pelo Stripe. Para impedir novas cobranças, cancele a renovação pela{" "}
          <Link href="/assinatura">área de assinatura</Link>. Esse cancelamento
          não devolve automaticamente os valores já pagos.
        </p>
        <p>
          Para solicitar reembolso ou informar uma cobrança incorreta, escreva
          para <a href="mailto:contato@magui.studio">contato@magui.studio</a>.
          A MAGUI.studio recebe e analisa o pedido e, quando o reembolso for
          devido, solicita sua execução pelo Stripe.
        </p>
        <p>
          Permanecem preservados os direitos previstos na legislação aplicável,
          inclusive o direito de arrependimento em até 7 dias nas contratações
          à distância em que o Código de Defesa do Consumidor se aplicar.
        </p>
      </>
    ),
  },
  {
    id: "responsabilidades",
    title: "Uso responsável e conteúdo",
    content: (
      <>
        <p>
          O responsável pelo estabelecimento deve manter serviços, preços,
          contatos e horários corretos, ter autorização para publicar nomes e
          imagens de profissionais e usar os dados dos clientes apenas para
          finalidades legítimas ligadas à relação de atendimento.
        </p>
        <ul>
          <li>
            Não publique conteúdo ilegal, discriminatório, enganoso ou que viole
            direitos de terceiros.
          </li>
          <li>
            Não crie reservas falsas, avaliações fraudulentas, acessos
            automatizados abusivos nem tente acessar contas ou dados sem
            autorização.
          </li>
          <li>
            Não registre prontuários, diagnósticos, informações de saúde ou
            outros dados pessoais sensíveis em campos livres e anotações de
            clientes. O Flow não é um sistema de prontuário.
          </li>
          <li>
            Respeite os compromissos agendados e comunique mudanças ao outro
            participante.
          </li>
        </ul>
        <p>
          O conteúdo cadastrado permanece de seu titular. Ao enviá-lo, você
          autoriza seu armazenamento, processamento e exibição na medida
          necessária para oferecer as funcionalidades solicitadas. A marca, o
          código e os elementos próprios do Flow são protegidos pelos direitos
          aplicáveis.
        </p>
      </>
    ),
  },
  {
    id: "disponibilidade",
    title: "Disponibilidade e segurança",
    content: (
      <>
        <p>
          O serviço pode ter interrupções para manutenção, falhas técnicas ou
          indisponibilidade de fornecedores. Não há garantia de funcionamento
          ininterrupto, de aquisição de clientes ou de resultado comercial. O
          responsável pelo negócio deve manter os meios de contato necessários
          para atender seus clientes em caso de indisponibilidade.
        </p>
        <p>
          Podemos restringir acessos ou conteúdo diante de indícios de fraude,
          violação destes termos, risco de segurança ou exigência legal. Sempre
          que possível, informaremos o motivo e permitiremos esclarecimentos
          pelo canal de suporte. Nenhuma previsão destes termos exclui
          responsabilidades ou direitos que a lei não permita afastar.
        </p>
      </>
    ),
  },
  {
    id: "encerramento",
    title: "Encerramento e dados",
    content: (
      <>
        <p>
          Para encerrar sua conta, envie um pedido para{" "}
          <a href="mailto:contato@magui.studio">contato@magui.studio</a>,
          preferencialmente pelo e-mail usado no Flow. Podemos confirmar sua
          identidade para evitar que outra pessoa encerre a conta por você. Se
          você assina um plano, cancele também a renovação na área de assinatura
          e confira a confirmação.
        </p>
        <p>
          O encerramento não implica apagar imediatamente todos os registros:
          informações necessárias para obrigações legais, prevenção de fraude e
          exercício de direitos podem ser preservadas. O tratamento de dados e
          os pedidos de exclusão seguem a{" "}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "Atualizações e legislação",
    content: (
      <>
        <p>
          Estes termos podem ser atualizados para refletir mudanças no produto e
          nas obrigações aplicáveis. A data da versão aparece no início da
          página. Mudanças relevantes serão comunicadas na plataforma ou pelo
          contato cadastrado, com antecedência quando necessário.
        </p>
        <p>
          Aplica-se a legislação brasileira, preservadas as normas obrigatórias
          de proteção de dados e do consumidor e o direito de recorrer ao foro
          competente previsto em lei.
        </p>
        <p>
          Referência:{" "}
          <a href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm">
            Código de Defesa do Consumidor
          </a>
          .
        </p>
      </>
    ),
  },
];

export default function Page() {
  return (
    <LegalPage
      kind="terms"
      title="Termos de Uso"
      description="Uma relação clara começa com informação. Entenda como funcionam as reservas, os planos e os compromissos de quem usa o Flow."
      sections={sections}
    />
  );
}
