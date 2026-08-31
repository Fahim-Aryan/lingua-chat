import { initials } from "../lib/utils";

export default function Avatar({ name, accent, size = 44, status, image }) {
  const dim = { width: size, height: size };
  const dotSize = Math.max(9, size * 0.24);
  const statusColor =
    status === "online"
      ? "oklch(0.65 0.15 155)"
      : status === "typing"
      ? "var(--accent)"
      : status === "away"
      ? "oklch(0.75 0.12 85)"
      : "var(--line-strong)";

  return (
    <span className="relative inline-flex shrink-0" style={dim}>
      {image ? (
        <img
          src={image}
          alt={name}
          className="h-full w-full rounded-[14px] object-cover"
        />
      ) : (
        <span
          className="grid h-full w-full place-items-center rounded-[14px] font-bold tracking-tight"
          style={{
            background: `color-mix(in oklch, ${accent || "var(--brand)"} 15%, white)`,
            color: `color-mix(in oklch, ${accent || "var(--brand)"} 75%, black)`,
            fontSize: size * 0.34,
          }}
        >
          {initials(name)}
        </span>
      )}
      {status && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-[2.5px] border-surface"
          style={{ width: dotSize, height: dotSize, background: statusColor }}
          aria-hidden
        />
      )}
    </span>
  );
}
