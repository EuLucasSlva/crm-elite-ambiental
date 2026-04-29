type BadgeVariant = "green" | "yellow" | "red" | "blue" | "gray" | "navy";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  green: "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-700",
  navy: "text-white",
};

export function Badge({
  variant = "gray",
  label,
}: {
  variant?: BadgeVariant;
  label: string;
}) {
  const base = "inline-block px-3 py-0.5 rounded-full text-xs font-bold";
  const cls = VARIANT_CLASSES[variant];
  const style =
    variant === "navy" ? { backgroundColor: "var(--navy)" } : undefined;

  return (
    <span className={`${base} ${cls}`} style={style}>
      {label}
    </span>
  );
}
