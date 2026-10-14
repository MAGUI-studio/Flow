import Link from "next/link";
import { AccountControls } from "./account-controls";
export function Header() {
  return (
    <header className="header wrap">
      <Link href="/" aria-label="Flow início">
        <img className="logo" src="/brand/logo_black.svg" alt="Flow" />
      </Link>
      <nav>
        <Link href="/#explorar">Explorar</Link>
        <Link href="/#como-funciona">Como funciona</Link>
        <Link href="/planos">
          Para seu negócio <span>↗</span>
        </Link>
      </nav>
      <AccountControls />
    </header>
  );
}
