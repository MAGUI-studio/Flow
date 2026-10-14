import { Container } from "@/components/container";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Header } from "@/components/header";
export default function Page() {
  return (
    <>
      <Header />
      <Container as="main" className="">
        <section className="panel login-panel">
          <div className="eyebrow" style={{ justifyContent: "flex-start" }}>
            BEM-VINDO AO FLOW
          </div>
          <h1>Seu próximo momento está aqui.</h1>
          <p>Entre com sua conta Google para acompanhar seus agendamentos.</p>
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
            <div style={{ marginTop: 24 }}>
              <SignIn
                routing="path"
                path="/entrar"
                forceRedirectUrl="/agendamentos"
              />
            </div>
          ) : (
            <div className="notice" style={{ marginTop: 24 }}>
              A conexão com o Clerk está em configuração. O login com Google
              será disponibilizado após vincular a aplicação.
            </div>
          )}
          <Link className="back-link" style={{ marginTop: 25 }} href="/">
            ← Voltar para explorar
          </Link>
        </section>
      </Container>
    </>
  );
}
