export function NotificationCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#635BFF] p-0 text-[9px] font-semibold leading-none tabular-nums text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
