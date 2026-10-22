"use client";
import { InternalShell } from "@/components/internal/shell";
import type { ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  return <InternalShell mode="admin">{children}</InternalShell>;
}
