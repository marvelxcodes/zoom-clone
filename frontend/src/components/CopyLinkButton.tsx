"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export default function CopyLinkButton({
  url,
  label = "Copy link",
  icon,
}: {
  url: string;
  label?: string;
  icon?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 rounded-[20px] border border-zoom-border-subtle bg-white px-3 py-1.5 text-xs font-medium text-zoom-text hover:bg-zoom-bg hover:border-zoom-blue-light transition-colors"
    >
      {copied ? (
        <>
          <Check size={14} className="text-green-600" /> Copied
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}
