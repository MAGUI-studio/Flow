import { Container } from "@/components/container";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AccountControls } from "./account-controls";
import { arrowMotion } from "./ui/arrow-link";
export function Header() {
  return (
    <Container as="header" className="header">
      <Link href="/" aria-label="Flow início">
        <img className="logo" src="/brand/logo_black.svg" alt="Flow" />
      </Link>
      <nav>
        <Link href="/explorar">Explorar</Link>
        <Link href="/#como-funciona">Como funciona</Link>
        <Link href="/planos" className="group inline-flex items-center gap-1.5">
          Para seu negócio{" "}
          <ArrowUpRight size={13} className={`text-[#635BFF] ${arrowMotion}`} />
        </Link>
      </nav>
      <AccountControls />
    </Container>
  );
}
