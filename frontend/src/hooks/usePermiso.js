import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { PERMISOS } from "../configs/permisos";

export function usePermiso() {
  const { usuario } = useContext(AuthContext);

  const puede = (accion) => {
    if (!usuario?.rol) return false;
    return PERMISOS[usuario.rol]?.acciones.includes(accion);
  };

  const puedeAcceder = (pagina) => {
    if (!usuario?.rol) return false;
    return PERMISOS[usuario.rol]?.paginas.includes(pagina);
  };

  return { puede, puedeAcceder };
}