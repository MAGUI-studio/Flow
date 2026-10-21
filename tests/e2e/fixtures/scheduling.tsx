import React from "react";
import { createRoot } from "react-dom/client";
import { UnsavedChangesProvider } from "../../../src/components/unsaved-changes";
import {
  BlockForm,
  SeriesForm,
} from "../../../src/components/internal/scheduling-forms";
import { WaitlistForm } from "../../../src/components/waitlist-form";
import { RescheduleForm } from "../../../src/components/reschedule-form";
const root = document.getElementById("flow-test-root")!;
const id = "00000000-0000-4000-8000-000000000001";
const professional = "00000000-0000-4000-8000-000000000002";
const service = "00000000-0000-4000-8000-000000000003";
createRoot(root).render(
  <UnsavedChangesProvider>
    <div className="mx-auto max-w-3xl p-5">
      {root.dataset.view === "block" ? (
        <BlockForm
          establishmentId={id}
          professionals={[{ id: professional, name: "Ana" }]}
          timezone="America/Sao_Paulo"
        />
      ) : root.dataset.view === "series" ? (
        <SeriesForm
          establishmentId={id}
          customers={[{ id: "client", name: "Maria" }]}
          services={[
            { id: service, name: "Consulta", professionalIds: [professional] },
          ]}
          professionals={[{ id: professional, name: "Ana" }]}
          timezone="America/Sao_Paulo"
        />
      ) : root.dataset.view === "waitlist" ? (
        <WaitlistForm
          serviceId={service}
          professionals={[{ id: professional, name: "Ana" }]}
          today="2027-01-01"
          horizon="2027-03-31"
        />
      ) : (
        <RescheduleForm
          bookingId={id}
          professionalId={professional}
          timezone="America/Sao_Paulo"
          original="01/01/2027 às 09:00 com Ana"
        />
      )}
    </div>
  </UnsavedChangesProvider>,
);
