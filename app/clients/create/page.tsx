import ClientForm from "../components/client-form";

export default function CreateClientPage() {
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create Client</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tambahkan client baru untuk invoice kamu.
          </p>
        </div>

        <ClientForm />
      </div>
    </div>
  );
}
