import type { CSSProperties } from "react";

type IconName =
  | "action-new-meeting"
  | "action-join"
  | "action-schedule"
  | "nav-home"
  | "nav-meetings"
  | "nav-chat"
  | "nav-more"
  | "nav-settings"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "search"
  | "history";

export default function ZoomIcon({
  name,
  size = 16,
  color,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const url = `/icons/${name}.svg`;
  const composed: CSSProperties = {
    display: "inline-block",
    width: size,
    height: size,
    backgroundColor: color ?? "currentColor",
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    flexShrink: 0,
    ...style,
  };
  return <span aria-hidden="true" className={className} style={composed} />;
}
