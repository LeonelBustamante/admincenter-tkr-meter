import { useEffect, useState, useCallback } from "react";
import { api } from "../servicios";

// Constantes para evitar repetición de código
const ENDPOINTS = {
    CANALES: "/api/canales/",
    CANAL_BY_ID: (id: number) => `/api/canales/${id}/`,
} as const;

const MENSAJES_ERROR = {
    CARGAR: "Error al cargar los canales",
    CREAR: "Error al crear el canal",
    ACTUALIZAR: "Error al actualizar el canal",
    ELIMINAR: "Error al eliminar el canal",
    OBTENER: "Error al obtener el canal",
} as const;

// Tipos para las operaciones CRUD
export interface ICanal {
    id: number;
    escala: number;
    formula: string;
    lR3S: boolean;
    max_sensor: number;
    nombre: string;
    offset: number;
    plc_id: number;
    plc_ip: string;
    posicion: number;
    tipo: "ANALOGICO" | "DIGITAL";
    unidad: string;
    tipo_vista: "CHART" | "LIQUID" | "RING";
    valor_minimo: number;
    valor_maximo: number;
}

export interface ICanalCrear extends Omit<ICanal, "id" | "plc_ip"> {}
export interface ICanalActualizar extends Partial<Omit<ICanal, "id" | "plc_ip">> {}

interface IEstadoCanales {
    data: ICanal[];
    cargando: boolean;
    error: string | null;
}

interface IOperacionesCRUD {
    obtenerCanales: () => Promise<void>;
    obtenerCanalPorId: (id: number) => Promise<ICanal | null>;
    crearCanal: (canal: ICanalCrear) => Promise<ICanal | null>;
    actualizarCanal: (id: number, canal: ICanalActualizar) => Promise<ICanal | null>;
    eliminarCanal: (id: number) => Promise<boolean>;
    limpiarError: () => void;
    refrescarDatos: () => Promise<void>;
}

/**
 * Hook personalizado para manejar operaciones CRUD de canales
 *
 * Proporciona un estado completo para la gestión de canales incluyendo:
 * - Lista de canales con estado de carga y errores
 * - Operaciones CRUD completas (crear, leer, actualizar, eliminar)
 * - Manejo centralizado de errores
 * - Actualización automática de datos
 *
 * @returns {IEstadoCanales & IOperacionesCRUD} Estado y operaciones para canales
 */
const useCanales = (): IEstadoCanales & IOperacionesCRUD => {
    const [data, setData] = useState<ICanal[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Maneja errores de manera centralizada
     * @param error - Error capturado
     * @param mensajePersonalizado - Mensaje de error personalizado
     */
    const manejarError = useCallback((error: any, mensajePersonalizado: string) => {
        console.error(`${mensajePersonalizado}:`, error);
        setError(mensajePersonalizado);
        setCargando(false);
    }, []);

    /**
     * Limpia el estado de error
     */
    const limpiarError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Obtiene todos los canales del servidor
     */
    const obtenerCanales = useCallback(async (): Promise<void> => {
        try {
            setCargando(true);
            setError(null);

            const response = await api.get(ENDPOINTS.CANALES);
            setData(response.data);
        } catch (error) {
            manejarError(error, MENSAJES_ERROR.CARGAR);
        } finally {
            setCargando(false);
        }
    }, [manejarError]);

    /**
     * Obtiene un canal específico por su ID
     * @param id - ID del canal a obtener
     * @returns Canal encontrado o null si hay error
     */
    const obtenerCanalPorId = useCallback(
        async (id: number): Promise<ICanal | null> => {
            try {
                setError(null);

                const response = await api.get(ENDPOINTS.CANAL_BY_ID(id));
                return response.data;
            } catch (error) {
                manejarError(error, MENSAJES_ERROR.OBTENER);
                return null;
            }
        },
        [manejarError]
    );

    /**
     * Crea un nuevo canal
     * @param canal - Datos del canal a crear
     * @returns Canal creado o null si hay error
     */
    const crearCanal = useCallback(
        async (canal: ICanalCrear): Promise<ICanal | null> => {
            try {
                setCargando(true);
                setError(null);

                const response = await api.post(ENDPOINTS.CANALES, canal);
                const nuevoCanal = response.data;

                // Actualizar el estado local agregando el nuevo canal
                setData((datosActuales) => [...datosActuales, nuevoCanal]);

                return nuevoCanal;
            } catch (error) {
                manejarError(error, MENSAJES_ERROR.CREAR);
                return null;
            } finally {
                setCargando(false);
            }
        },
        [manejarError]
    );

    /**
     * Actualiza un canal existente
     * @param id - ID del canal a actualizar
     * @param canal - Datos a actualizar
     * @returns Canal actualizado o null si hay error
     */
    const actualizarCanal = useCallback(
        async (id: number, canal: ICanalActualizar): Promise<ICanal | null> => {
            try {
                setCargando(true);
                setError(null);

                const response = await api.put(ENDPOINTS.CANAL_BY_ID(id), canal);
                const canalActualizado = response.data;

                // Actualizar el estado local
                setData((datosActuales) => datosActuales.map((item) => (item.id === id ? canalActualizado : item)));

                return canalActualizado;
            } catch (error) {
                manejarError(error, MENSAJES_ERROR.ACTUALIZAR);
                return null;
            } finally {
                setCargando(false);
            }
        },
        [manejarError]
    );

    /**
     * Elimina un canal por su ID
     * @param id - ID del canal a eliminar
     * @returns true si se eliminó correctamente, false si hay error
     */
    const eliminarCanal = useCallback(
        async (id: number): Promise<boolean> => {
            try {
                setCargando(true);
                setError(null);

                await api.delete(ENDPOINTS.CANAL_BY_ID(id));

                // Actualizar el estado local removiendo el canal
                setData((datosActuales) => datosActuales.filter((canal) => canal.id !== id));

                return true;
            } catch (error) {
                manejarError(error, MENSAJES_ERROR.ELIMINAR);
                return false;
            } finally {
                setCargando(false);
            }
        },
        [manejarError]
    );

    /**
     * Refresca los datos obteniendo la lista actualizada del servidor
     */
    const refrescarDatos = useCallback(async (): Promise<void> => {
        await obtenerCanales();
    }, [obtenerCanales]);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        obtenerCanales();
    }, [obtenerCanales]);

    return {
        // Estado
        data,
        cargando,
        error,

        // Operaciones CRUD
        obtenerCanales,
        obtenerCanalPorId,
        crearCanal,
        actualizarCanal,
        eliminarCanal,

        // Utilidades
        limpiarError,
        refrescarDatos,
    };
};

export default useCanales;
