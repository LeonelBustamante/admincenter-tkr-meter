import { useEffect, useState } from "react";
import { api } from "../servicios";
import { INota } from "../types";

const useCanales = () => {
    const [datos, setDatos] = useState<INota[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const obtenerNotas = () => {
        setCargando(true);
        api.get("/api/notas/")
            .then((response) => {
                setDatos(response.data);
            })
            .catch(() => {
                setError("Error al cargar las notas");
            })
            .finally(() => {
                setCargando(false);
            });
    };

    useEffect(() => {
        obtenerNotas();
    }, []);

    return {
        datos,
        cargando,
        error,
    };
};

export default useCanales;
