import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { NotificationsDrawer } from "../../../src/components/notifications-drawer";
import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from "../../../src/components/unsaved-changes";
function Editor() {
  const [name, setName] = useState("Ana");
  useUnsavedChanges(name !== "Ana");
  return (
    <div className="p-6">
      <label>
        Nome para edição
        <input
          aria-label="Nome para edição"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <a href="/explorar">Sair da edição</a>
    </div>
  );
}
createRoot(document.getElementById("flow-test-root")!).render(
  <UnsavedChangesProvider>
    <div className="mx-auto w-full max-w-440 p-6">
      <NotificationsDrawer />
      <Editor />
    </div>
  </UnsavedChangesProvider>,
);
