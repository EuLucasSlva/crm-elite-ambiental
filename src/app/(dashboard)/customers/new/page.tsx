import { NewCustomerForm } from "./NewCustomerForm";

export default function NewCustomerPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Preencha os dados abaixo para cadastrar um novo cliente.
        </p>
      </div>
      <NewCustomerForm />
    </div>
  );
}
