"use client";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { FlowSelect } from "@/components/ui/flow-select";
export function ReportPeriod() {
  const [days, setDays] = useQueryState(
    "dias",
    parseAsStringEnum(["7", "30", "90"])
      .withDefault("30")
      .withOptions({ shallow: false, scroll: false }),
  );
  return (
    <FlowSelect
      aria-label="Período do relatório"
      value={days}
      onValueChange={(value) => void setDays(value as "7" | "30" | "90")}
    >
      <option value="7">Últimos 7 dias</option>
      <option value="30">Últimos 30 dias</option>
      <option value="90">Últimos 90 dias</option>
    </FlowSelect>
  );
}
