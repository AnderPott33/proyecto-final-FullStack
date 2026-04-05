import { Link } from "react-router-dom";

import { MdBlock } from "react-icons/md";

export default function ErrorPermiso() {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <div className="p-10 rounded-sm flex flex-col items-center justify-center bg-[#35b9ac]/30">
      <h1 className="text-5xl flex justify-center items-center gap-4 font-bold text-red-600 mb-4"><MdBlock className="text-8xl" /> Acceso Denegado</h1>
      <p className="text-lg text-gray-700 mb-6">
        No tienes permiso para acceder a esta página.
      </p>
      <Link
        to="/dashboard"
        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
      >
        Volver al inicio
      </Link>
      </div>
    </div>
  );
}