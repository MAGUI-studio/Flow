import Link from "next/link";
import {
  LegalPage,
  LegalContact,
  type LegalSection,
} from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Política de Privacidade",
  "Entenda quais dados o Flow utiliza, com quem são compartilhados e como exercer seus direitos de privacidade.",
  "/privacidade",
);

const sections: LegalSection[] = [
  {
    id: "responsavel",
    title: "Quem cuida dos seus dados",
    content: (
      <>
        <LegalContact />
        <p>
          Esta política explica o tratamento de dados pessoais no Flow. Para as
          finalidades próprias da plataforma, como conta, segurança e
          assinatura, o responsável pelo Flow atua como controlador. O
          estabelecimento também tem responsabilidades sobre os dados que
          utiliza na sua relação com clientes e equipe. Quando o Flow armazena
          informações por instrução do estabelecimento, atua como operador,
          conforme a atividade realizada.
        </p>
      </>
    ),
  },
  {
    id: "dados",
    title: "Dados utilizados",
    content: (
      <>
        <ul>
          <li>
            <strong>Conta:</strong> identificador de usuário, nome, e-mail e
            dados de perfil disponibilizados no login pelo Google e gerenciados
            pelo Clerk. O Flow não recebe sua senha do Google.
          </li>
          <li>
            <strong>Agendamentos:</strong> serviço, estabelecimento,
            profissional, data, horário, duração, preço, status, telefone
            informado, presença, cancelamentos, reagendamentos, recorrências e
            preferências da lista de espera.
          </li>
          <li>
            <strong>Relacionamento:</strong> favoritos, notas de avaliação,
            notificações e seu estado de leitura, além de anotações operacionais
            inseridas pelo estabelecimento sobre o cliente.
          </li>
          <li>
            <strong>Negócios e equipe:</strong> nome, descrição, categoria,
            endereço, contatos, links, imagens, nomes e fotos de profissionais,
            serviços, horários e períodos de indisponibilidade.
          </li>
          <li>
            <strong>Assinatura:</strong> plano, status, períodos,
            identificadores do cliente e da assinatura no Stripe e registros
            necessários para reconciliar eventos de cobrança. Os dados completos
            do cartão são tratados pelo Stripe e não são armazenados no banco do
            Flow.
          </li>
          <li>
            <strong>Uso técnico:</strong> endereço IP e informações de
            requisição, navegador, sessão e registros de operações e falhas,
            conforme processados pela aplicação e sua infraestrutura.
          </li>
        </ul>
        <p>
          Alguns dados são necessários para autenticar, reservar ou contratar.
          Sem eles, a funcionalidade correspondente pode não estar disponível.
          Campos opcionais podem ser deixados em branco.
        </p>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "Finalidades e bases legais",
    content: (
      <>
        <p>
          Utilizamos os dados necessários para criar e manter contas, realizar
          reservas, disponibilizar agendas, administrar assinaturas e atender
          solicitações, com fundamento na execução de contrato ou de
          procedimentos preliminares solicitados por você.
        </p>
        <p>
          Registros necessários ao cumprimento de obrigações legais e
          regulatórias são tratados com essa finalidade. Também podemos
          preservar informações para o exercício regular de direitos em
          processos.
        </p>
        <p>
          A segurança, a prevenção de abuso e o diagnóstico de falhas podem
          envolver legítimo interesse, mediante avaliação de necessidade e dos
          direitos dos titulares. Quando uma atividade depender de
          consentimento, ele deverá ser solicitado de forma específica e poderá
          ser revogado. A leitura desta política não equivale a consentimento
          genérico para qualquer uso de dados.
        </p>
      </>
    ),
  },
  {
    id: "visibilidade",
    title: "O que fica público e o que é compartilhado",
    content: (
      <>
        <p>
          As páginas publicadas dos estabelecimentos podem exibir nome e imagem
          do negócio, descrição, endereço, contatos comerciais, equipe,
          serviços, preços e disponibilidade. Essas informações podem aparecer
          em buscadores. As notas enviadas pelos clientes contribuem para os
          indicadores públicos de avaliação.
        </p>
        <p>
          O responsável pelo estabelecimento pode acessar os dados necessários
          para administrar os atendimentos, incluindo identificação e contato do
          cliente, reservas e histórico relacionado ao seu negócio. Favoritos e
          notificações pessoais não são publicados como listas públicas.
        </p>
        <p>
          Para oferecer o Flow, contamos com fornecedores que tratam os dados
          necessários a cada serviço:
        </p>
        <ul>
          <li>
            <strong>Google e Clerk:</strong> acesso à conta e autenticação.
          </li>
          <li>
            <strong>Stripe:</strong> processamento de pagamentos e assinaturas.
          </li>
          <li>
            <strong>Vercel e Neon:</strong> hospedagem e armazenamento dos dados.
          </li>
          <li>
            <strong>UploadThing:</strong> armazenamento das imagens enviadas.
          </li>
          <li>
            <strong>OpenStreetMap e Photon:</strong> mapas e pesquisa de
            endereços. Ao usar esses recursos, os fornecedores podem receber
            seu endereço IP, a região exibida no mapa e os endereços pesquisados,
            conforme o serviço utilizado.
          </li>
        </ul>
        <p>
          Também podemos compartilhar dados quando necessário para cumprir a
          lei, proteger direitos ou apurar fraudes. Os serviços externos possuem
          suas próprias políticas de privacidade.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies e armazenamento no navegador",
    content: (
      <>
        <p>
          O Flow e seus fornecedores de autenticação utilizam cookies e recursos
          de sessão para manter o login e proteger o acesso. Desativar esses
          recursos no navegador pode impedir a autenticação e outras
          funcionalidades.
        </p>
        <p>
          Esta versão não inclui integração própria de publicidade
          comportamental ou analytics de marketing. A inclusão de recursos
          opcionais que dependam de consentimento deverá ser acompanhada das
          informações e controles correspondentes. A política será atualizada se
          essas práticas mudarem.
        </p>
      </>
    ),
  },
  {
    id: "retencao",
    title: "Armazenamento, conservação e segurança",
    content: (
      <>
        <p>
          Dados são mantidos enquanto necessários às finalidades descritas, à
          relação de uso e às obrigações aplicáveis. Pedidos de encerramento e
          exclusão são analisados considerando registros de atendimento,
          cobrança, segurança e exercício de direitos. Não existe exclusão
          automática de todo o histórico ao cancelar uma assinatura.
        </p>
        <p>
          Fornecedores podem processar dados em outros países. Quando houver
          transferência internacional, devem ser observados os mecanismos e as
          garantias exigidos pela legislação brasileira. Você pode solicitar
          informações sobre os fornecedores e as transferências pelo nosso
          contato.
        </p>
        <p>
          A plataforma utiliza autenticação, verificações de autorização e
          restrições de acesso para proteger informações. Nenhum sistema é
          isento de riscos. Se identificar acesso indevido ou exposição de
          dados, avise{" "}
          <a href="mailto:contato@magui.studio">contato@magui.studio</a>. Incidentes
          serão avaliados e comunicados aos titulares e à autoridade quando
          exigido.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "Seus direitos e como solicitar",
    content: (
      <>
        <p>
          Nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD), você
          pode solicitar, conforme o caso:
        </p>
        <ul>
          <li>Confirmação do tratamento e acesso aos seus dados.</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
          <li>
            Anonimização, bloqueio ou eliminação de dados desnecessários,
            excessivos ou tratados em desconformidade.
          </li>
          <li>
            Portabilidade, observadas a regulamentação e as condições legais.
          </li>
          <li>
            Informações sobre compartilhamento, consentimento e consequências de
            não consentir.
          </li>
          <li>
            Revogação do consentimento e eliminação dos dados tratados com essa
            base, ressalvadas as hipóteses legais de conservação.
          </li>
          <li>
            Oposição nos casos previstos em lei e revisão de decisões tomadas
            unicamente por tratamento automatizado que afetem seus interesses.
          </li>
        </ul>
        <p>
          Envie seu pedido para{" "}
          <a href="mailto:contato@magui.studio">contato@magui.studio</a>,
          preferencialmente a partir do e-mail da conta, indicando o direito que
          deseja exercer. Não envie senhas nem dados completos do cartão.
          Poderemos pedir informações estritamente necessárias para verificar a
          identidade e proteger seus dados.
        </p>
        <p>
          O atendimento observará os prazos e as condições legais. Se algum dado
          precisar ser conservado ou o pedido não puder ser atendido,
          explicaremos o motivo. Solicitações sobre tratamentos próprios de um
          estabelecimento também podem ser dirigidas ao contato público dele.
          Você pode apresentar reclamação à{" "}
          <a href="https://www.gov.br/anpd/pt-br">
            autoridade brasileira de proteção de dados
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "cuidados",
    title: "Dados sensíveis e menores de idade",
    content: (
      <>
        <p>
          O Flow não é um prontuário. Não inclua diagnósticos, informações
          clínicas, documentos de saúde, dados biométricos ou outros dados
          sensíveis nos campos de texto, imagens e anotações operacionais. Mesmo
          a escolha de um serviço pode revelar informações sobre você;
          compartilhe apenas o necessário para seu atendimento.
        </p>
        <p>
          A plataforma não é direcionada ao uso autônomo por crianças. Quando
          houver atendimento de menores, o estabelecimento e os responsáveis
          legais devem observar as autorizações necessárias e o melhor interesse
          da criança ou do adolescente. Se identificar dados de menores
          utilizados indevidamente, entre em contato para avaliação e
          providências.
        </p>
      </>
    ),
  },
  {
    id: "atualizacoes",
    title: "Atualizações e contato",
    content: (
      <>
        <p>
          Esta política pode mudar para refletir funcionalidades, fornecedores e
          obrigações legais. A data no início da página identifica a versão.
          Mudanças relevantes serão comunicadas na plataforma ou pelo contato
          cadastrado; quando necessário, solicitaremos novo consentimento.
        </p>
        <p>
          Para dúvidas sobre privacidade ou encerramento de conta:{" "}
          <a href="mailto:contato@magui.studio">contato@magui.studio</a>. Consulte
          também os <Link href="/termos">Termos de Uso</Link>.
        </p>
        <p>
          Referência:{" "}
          <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm">
            Lei Geral de Proteção de Dados Pessoais
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
      kind="privacy"
      title="Política de Privacidade"
      description="Saiba quais informações fazem parte da sua experiência, por que são utilizadas e como cuidar dos seus direitos."
      sections={sections}
    />
  );
}
