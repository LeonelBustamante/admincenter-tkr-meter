import { useEffect, useState } from "react";
import { api } from "../servicios";
import { IEquipo } from "../types";

const useEquipo = () => {
    const [datos, setDatos] = useState<IEquipo[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const obtenerEquipos = () => {
        setCargando(true);
        api.get("/api/equipos/")
            .then((response) => {
                setDatos(response.data);
            })
            .catch(() => {
                setError("Error al cargar los equipos");
            })
            .finally(() => {
                setCargando(false);
            });
    };

    useEffect(() => {
        obtenerEquipos();
    }, []);

    return {
        datos,
        cargando,
        error,
    };
};

export default useEquipo;
