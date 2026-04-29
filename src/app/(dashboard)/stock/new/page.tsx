import Link from "next/link";
import { NewStockItemForm } from "./NewStockItemForm";

export default function NewStockItemPage() {
  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/stock" className="hover:text-green-700 hover:underline">
          Estoque
        </Link>
        <span>/</span>
        <span className="text-gray-700">Novo Item</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Novo Item de Estoque
      </h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <NewStockItemForm />
      </div>
    </div>
  );
}
