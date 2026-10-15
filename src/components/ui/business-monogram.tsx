export function BusinessMonogram({
  name,
  compact = false,
}: {
  name: string;
  compact?: boolean;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLowerCase();
  return (
    <span
      aria-hidden="true"
      className={`relative mt-0 inline-block font-[Georgia,serif] text-[#413b3e] ${compact ? "text-[25px] leading-none tracking-[-3px]" : "text-[65px] tracking-[-7px]"}`}
    >
      {initials}
      <span
        className={`absolute top-0 mt-0 tracking-normal ${compact ? "-right-[9px] text-[12px]" : "-right-[22px] text-[30px]"}`}
      >
        ✳
      </span>
    </span>
  );
}
