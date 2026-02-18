import RegisterForm from "./components/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border p-6">
        <h1 className="text-xl font-semibold">Register</h1>
        <p className="mt-1 text-sm text-gray-600">
          Buat akun untuk mulai bikin invoice.
        </p>

        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
