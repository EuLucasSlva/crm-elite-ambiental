import Link from "next/link";

interface Props {
  orderId: string;
}

const btnCls =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80";
const btnStyle = { background: "var(--card-bg)", border: "1px solid #d0d5e8", color: "var(--text-muted)" };

export function PrintButton({ orderId }: Props) {
  return (
    <>
      <Link
        href={`/print/service-orders/${orderId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btnCls}
        style={btnStyle}
      >
        🖨 Imprimir OS
      </Link>
      <Link
        href={`/print/service-orders/${orderId}/visitas`}
        target="_blank"
        rel="noopener noreferrer"
        className={btnCls}
        style={btnStyle}
      >
        📅 Próximas Visitas
      </Link>
    </>
  );
}
