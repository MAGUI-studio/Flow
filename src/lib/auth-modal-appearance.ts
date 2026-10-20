import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/nextjs";

export const authModalAppearance: NonNullable<
  ComponentProps<typeof SignIn>["appearance"]
> = {
  options: {
    logoImageUrl: "/brand/logo_black.svg",
    logoLinkUrl: "/",
    logoPlacement: "inside",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "#635BFF",
    colorBackground: "#FFFFFF",
    colorForeground: "#18181B",
    colorMutedForeground: "#77767E",
    colorBorder: "#E8E5F6",
    colorRing: "#635BFF",
    borderRadius: "14px",
    fontFamily: "'DM Sans', Arial, sans-serif",
  },
  elements: {
    modalBackdrop: "bg-[#181528]/45! backdrop-blur-sm!",
    modalContent: "mx-4! w-[calc(100vw-2rem)]! max-w-[440px]!",
    modalCloseButton:
      "top-4! right-4! size-8! rounded-full! text-zinc-400! transition-colors! hover:bg-[#F5F4FF]! hover:text-[#635BFF]! focus-visible:outline-[#635BFF]!",
    rootBox: "w-full!",
    cardBox:
      "w-full! overflow-hidden! rounded-[26px]! border! border-[#E8E5F6]! bg-white! bg-none! shadow-[0_24px_80px_-20px_rgba(24,21,40,0.3)]!",
    card: "relative! isolate! w-full! overflow-hidden! rounded-none! border-0! bg-white! px-7! pt-10! pb-8! shadow-none! sm:px-10! before:pointer-events-none before:absolute before:-top-10 before:-right-14 before:-z-10 before:size-56 before:rotate-12 before:bg-[url('/brand/icon.svg')] before:bg-contain before:bg-center before:bg-no-repeat before:opacity-[0.04] before:content-['']",
    logoBox: "mb-7! justify-center!",
    logoImage: "h-9! w-auto! max-w-28!",
    header: "gap-2! text-center!",
    headerTitle:
      "text-[26px]! leading-tight! font-semibold! tracking-tight! text-zinc-900!",
    headerSubtitle: "text-[13px]! leading-relaxed! text-zinc-500!",
    main: "gap-6!",
    socialButtonsBlockButton:
      "min-h-12! rounded-xl! border! border-[#E8E5F6]! bg-white! px-5! shadow-none! transition-colors! hover:border-[#635BFF]/40! hover:bg-[#F5F4FF]! focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-[#635BFF]!",
    socialButtonsBlockButtonText: "text-[13px]! font-medium! text-zinc-800!",
    socialButtonsProviderIcon: "size-[18px]!",
    formButtonPrimary:
      "min-h-12! rounded-xl! bg-[#635BFF]! text-sm! font-medium! shadow-none! hover:bg-[#5046E5]!",
    formFieldInput:
      "min-h-11! rounded-xl! border-[#E8E5F6]! shadow-none! focus:border-[#635BFF]!",
    footer:
      "gap-4! border-t! border-[#E8E5F6]! bg-[#F8F7FF]! bg-none! px-5! py-5! sm:px-10! [&_*]:bg-none! [&_*]:before:hidden! [&_*]:after:hidden!",
    footerAction: "w-full! flex-wrap! justify-center! gap-x-1.5! gap-y-1!",
    footerActionText: "text-xs! whitespace-nowrap! text-zinc-500!",
    footerActionLink:
      "text-xs! whitespace-nowrap! font-semibold! text-[#635BFF]! underline-offset-4! hover:underline!",
  },
};
