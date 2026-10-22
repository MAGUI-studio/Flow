"use client";
import { Fragment } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { ChevronDown } from "lucide-react";
import { AdminFields, AdminTable } from "./primitives";

export type AdminRecord = { id: string; fields: [string, string][] };
export function AdminRecordsTable({
  title,
  records,
  columns,
}: {
  title: string;
  records: AdminRecord[];
  columns: string[];
}) {
  const [expanded, setExpanded] = useQueryState(
    "registro",
    parseAsString.withOptions({ shallow: true, scroll: false }),
  );
  return (
    <AdminTable
      title={title}
      count={records.length}
      description="Abra um registro para consultar os detalhes."
      headers={[...columns, "Detalhes"]}
    >
      {records.map((record) => {
        const open = expanded === record.id;
        return (
          <Fragment key={record.id}>
            <tr>
              {columns.map((column, index) => (
                <td
                  key={column}
                  className={index === 0 ? "font-medium text-zinc-800!" : ""}
                >
                  <span className="block max-w-72 truncate">
                    {record.fields.find(([label]) => label === column)?.[1] ||
                      "—"}
                  </span>
                </td>
              ))}
              <td className="text-right">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`record-${record.id}`}
                  onClick={() => {
                    void setExpanded(open ? null : record.id);
                  }}
                  className="inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-3 text-[11px] font-medium text-zinc-600 hover:border-[#635BFF]/30 hover:text-[#635BFF]"
                >
                  {open ? "Fechar" : "Ver detalhes"}
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className={open ? "rotate-180" : ""}
                  />
                </button>
              </td>
            </tr>
            {open && (
              <tr id={`record-${record.id}`}>
                <td
                  colSpan={columns.length + 1}
                  className="bg-[#fafaff] p-5! sm:p-6!"
                >
                  <AdminFields
                    fields={record.fields.map(([label, value]) => [
                      label,
                      <span key={label} className="whitespace-pre-wrap">
                        {value}
                      </span>,
                    ])}
                  />
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </AdminTable>
  );
}
