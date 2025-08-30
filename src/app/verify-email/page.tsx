import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Revisa tu Correo Electrónico
        </h1>

        <div className="text-center mb-8">
          <p className="mb-4">
            Hemos enviado un enlace de verificación a tu dirección de correo
            electrónico.
          </p>
          <p className="text-sm text-gray-600">
            Por favor revisa tu bandeja de entrada y haz clic en el enlace para
            verificar tu cuenta. Si no ves el correo, revisa tu carpeta de spam.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
