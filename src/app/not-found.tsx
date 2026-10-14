import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap page-intro">
      <h1>Esse espaço não foi encontrado.</h1>
      <p className="muted-text">
        Confira o endereço ou encontre outro profissional no Flow.
      </p>
      <Link className="button" style={{ marginTop: 25 }} href="/">
        Explorar espaços
      </Link>
    </main>
  );
}
