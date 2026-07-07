import { LucideIcon } from "lucide-react";

export default function ActionCard({
  icon: Icon,
  label,
  subLabel,
  onClick,
  variant = "default",
}: {
  icon: LucideIcon;
  label: string;
  subLabel?: string;
  onClick?: () => void;
  variant?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-zoom-border-subtle bg-white p-5 text-left transition-all hover:border-zoom-blue-light hover:shadow-[0_4px_20px_rgba(11,92,255,0.08)] hover:-translate-y-0.5 focus:outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/20"
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg ${
          variant === "primary"
            ? "bg-zoom-blue text-white"
            : "bg-zoom-bg text-zoom-blue group-hover:bg-zoom-blue/10"
        }`}
      >
        <Icon size={24} />
      </div>
      <div>
        <div className="text-[15px] font-semibold text-zoom-text">{label}</div>
        {subLabel && (
          <div className="text-xs text-zoom-muted mt-0.5">{subLabel}</div>
        )}
      </div>
    </button>
  );
}
