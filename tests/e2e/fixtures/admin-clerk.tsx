import React from "react";
export function useUser() {
  return {
    isSignedIn: false,
    user: {
      id: "preview-admin",
      firstName: "Administrador",
      primaryEmailAddress: { emailAddress: "admin@exemplo.test" },
    },
  };
}
export function UserButton() {
  return (
    <span className="grid size-8 place-items-center rounded-full bg-[#F5F4FF] text-[10px] font-semibold text-[#635BFF]">
      AD
    </span>
  );
}
UserButton.MenuItems = ({ children }: { children: React.ReactNode }) => null;
UserButton.Link = () => null;
