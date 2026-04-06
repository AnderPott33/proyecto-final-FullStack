import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CajaContext = createContext();

export function CajaProvider({ children }) {
    const [caja, setCaja] = useState(null);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(localStorage.getItem("token"));

    const API = "https://owl-soft.onrender.com";

    const obtenerCaja = async (customToken) => {
        const tokenToUse = customToken || token;
        if (!tokenToUse) return;

        setLoading(true);

        try {
            const res = await axios.get(
                `${API}/api/caja/activa`,
                {
                    headers: {
                        Authorization: `Bearer ${tokenToUse}`,
                    },
                }
            );

            setCaja(res.data);
        } catch (error) {
            console.error(error);
            setCaja(null);
        } finally {
            setLoading(false);
        }
    };

    // 👇 ahora reacciona al token
    useEffect(() => {
        if (token) {
            obtenerCaja(token);
        }
    }, [token]);

    // 👇 función para actualizar token desde fuera
    const actualizarToken = (newToken) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    };

    return (
        <CajaContext.Provider
            value={{
                caja,
                setCaja,
                loading,
                obtenerCaja,
                actualizarToken // 👈 clave
            }}
        >
            {children}
        </CajaContext.Provider>
    );
}

export function useCaja() {
    return useContext(CajaContext);
}