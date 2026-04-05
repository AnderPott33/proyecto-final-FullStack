import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Loader from "../components/Loader";
import SelectCustom from "../components/SelectCustom";

export default function SeleccionarPuntoExp() {
  const {
    usuario,
    puntoSeleccionado,
    puntosUsuario,
    seleccionarPunto,
    loading,
  } = useContext(AuthContext);

  const navigate = useNavigate();

  // Lógica de selección y redirección
  useEffect(() => {
    if (!loading && usuario) {
      // Si ya hay un punto seleccionado → ir al dashboard
      if (puntoSeleccionado) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Filtra solo los puntos habilitados
      const puntosHabilitados = puntosUsuario?.filter((p) => p.activo);

      // Si hay solo 1 punto habilitado → selección automática y redirección
      if (puntosHabilitados?.length === 1) {
        seleccionarPunto(puntosHabilitados[0]);
        navigate("/dashboard", { replace: true });
      }
      // Si hay 0 o más de 1 → se muestra el modal para selección
    }
  }, [
    usuario,
    puntosUsuario,
    puntoSeleccionado,
    loading,
    seleccionarPunto,
    navigate,
  ]);

  if (loading || !usuario) return <Loader />;

  // Función para seleccionar manualmente un punto
  const handleSeleccionPunto = (value) => {
    const punto = puntosUsuario?.find(
      (p) => p.id === Number(value) && p.activo
    );
    if (punto) {
      seleccionarPunto(punto);
      navigate("/dashboard", { replace: true });
    }
  };

  // Bloquea toda la app hasta que se seleccione un punto
  return (
    <div className="fixed inset-0 bg-[#0f172a] z-[9999] flex justify-center items-center">
      {!puntoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#111827] rounded-2xl p-8 w-96 shadow-lg border-t-4 border-[#35b9ac]">
            <h2 className="text-xl font-bold text-center text-white mb-4">
              Selecciona tu punto
            </h2>

            <SelectCustom
              options={puntosUsuario
                ?.filter((p) => p.activo)
                .sort((a, b) => a.id - b.id)
                .map((p) => ({ value: p.id, label: `${p.id} - ${p.nombre}` }))}
              value={puntoSeleccionado?.id || ""}
              onChange={handleSeleccionPunto}
              placeholder="-- Selecciona --"
              isClearable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}