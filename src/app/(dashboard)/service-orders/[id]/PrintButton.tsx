import Link from "next/link";

interface Props {
  orderId: string;
}

export function PrintButton({ orderId }: Props) {
  return (
    <Link
      href={`/print/service-orders/${orderId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80"
      style={{ background: "var(--card-bg)", border: "1px solid #d0d5e8", color: "var(--text-muted)" }}
    >
      🖨 Imprimir OS
    </Link>
  );
}
