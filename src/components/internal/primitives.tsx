import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, Sparkles, Plus } from "lucide-react";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
  back,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="internal-page-heading">
      {back && (
        <Link className="internal-back" href={back.href}>
          <ArrowLeft size={14} />
          {back.label}
        </Link>
      )}
      <div className="heading-main">
        <div>
          {eyebrow && <span className="internal-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action && <div className="heading-action">{action}</div>}
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  href,
  label,
  icon,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="internal-empty">
      <span className="internal-empty-icon">
        {icon ?? <Sparkles size={25} />}
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {href && (
        <Link href={href} className="button">
          <Plus size={16} />
          {label ?? "Começar"}
        </Link>
      )}
    </div>
  );
}
export function SectionCard({
  title,
  description,
  children,
  aside,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="internal-card">
      <div className="internal-card-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
export function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="internal-form-section">
      <header className="relative isolate block overflow-hidden pr-20">
        <span
          aria-hidden="true"
          className="section-watermark pointer-events-none absolute -top-5 right-0 -z-10 rounded-none border-0 bg-transparent p-0 text-7xl font-extrabold tracking-tighter text-[#635BFF]/8"
        >
          {number}
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className="form-section-fields">{children}</div>
    </section>
  );
}
export function StatusPill({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span className={`status-pill status-${status}`}>
      <i />
      {label}
    </span>
  );
}
