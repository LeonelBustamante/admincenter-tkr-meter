import { useEffect, useState } from "react";
import { api } from "../servicios";
import { ICanal } from "../types";

const useCanales = () => {
    const [datos, setDatos] = useState<ICanal[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const obtenerCanales = () => {
        setCargando(true);
        api.get("/api/canales/")
            .then((response) => {
                setDatos(response.data);
            })
            .catch(() => {
                setError("Error al cargar los canales");
            })
            .finally(() => {
                setCargando(false);
            });
    };

    useEffect(() => {
        obtenerCanales();
    }, []);

    return {
        datos,
        cargando,
        error,
    };
};

export default useCanales;
