import type { SelectProps } from "antd";
import { Select, Typography } from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { TablaCrud } from "../../componentes";
import { TipoPermiso } from "../../types";

const { Title } = Typography;

// Constantes para los tipos de permisos
const PERMISSION_TYPES = {
    VIEW_ONLY: "VER" as const,
    FULL_ACCESS: "SI" as const,
    NO_ACCESS: "NO" as const,
};

// Interface para las opciones del selector
interface EndpointOption {
    readonly label: string;
    readonly value: string;
}

// Props del componente con tipado estricto
interface ABMProps {
    readonly tipoPermiso: TipoPermiso;
}

// Configuración de endpoints - constante para evitar recreación
const ENDPOINT_CONFIG: Record<TipoPermiso, readonly EndpointOption[]> = {
    [PERMISSION_TYPES.VIEW_ONLY]: [{ label: "Canales", value: "/api/canales/" }],
    [PERMISSION_TYPES.FULL_ACCESS]: [
        { label: "Canales", value: "/api/canales/" },
        { label: "Clientes", value: "/api/clientes/" },
        { label: "Equipos", value: "/api/equipos/" },
        { label: "Notas", value: "/api/notas/" },
        { label: "PLC", value: "/api/plcs/" },
        { label: "Ubicaciones", value: "/api/ubicaciones/" },
    ],
    [PERMISSION_TYPES.NO_ACCESS]: [],
} as const;

// Estilos constantes para evitar recreación en cada render
const COMPONENT_STYLES = {
    select: {
        width: 200,
        marginBottom: 16,
        marginRight: 16,
    },
} as const;

/**
 * Componente ABM para gestión de datos con diferentes niveles de permisos
 * Permite consultar y gestionar información según el tipo de permiso del usuario
 */
const ABM: React.FC<ABMProps> = ({ tipoPermiso }) => {
    // Validación de prop requerida
    if (!tipoPermiso || !(["SI", "NO", "VER"] as const).includes(tipoPermiso)) {
        console.error("ABM: tipoPermiso debe ser uno de: SI, NO, VER");
        return null;
    }

    // Manejo del caso "NO" - sin permisos
    if (tipoPermiso === PERMISSION_TYPES.NO_ACCESS) {
        return (
            <div role="alert" aria-label="Sin permisos de acceso">
                <Title level={2} style={{ marginBottom: 24 }}>
                    Sin permisos de acceso
                </Title>
            </div>
        );
    }

    // Opciones memoizadas para evitar recálculos innecesarios
    const opciones = useMemo(
        () => ENDPOINT_CONFIG[tipoPermiso] || ENDPOINT_CONFIG[PERMISSION_TYPES.VIEW_ONLY],
        [tipoPermiso]
    );

    // Estado del endpoint seleccionado
    const [endpoint, setEndpoint] = useState<string>(opciones[0].value);

    // Título memoizado basado en permisos
    const titulo = useMemo(
        () => (tipoPermiso === PERMISSION_TYPES.FULL_ACCESS ? "Centro de gestión" : "Consultar información"),
        [tipoPermiso]
    );

    // Handler memoizado para el cambio de endpoint
    const handleEndpointChange = useCallback((value: string) => {
        setEndpoint(value);
    }, []);

    // Props memoizadas para el Select
    const selectProps: SelectProps = useMemo(
        () => ({
            defaultValue: opciones[0].value,
            style: COMPONENT_STYLES.select,
            onChange: handleEndpointChange,
            options: [...opciones],
            placeholder: "Seleccionar endpoint",
            showSearch: false,
            allowClear: false,
        }),
        [opciones, handleEndpointChange]
    );

    return (
        <div role="main" aria-label="Módulo de gestión ABM">
            <Title level={2} data-testid="abm-title" style={{ marginBottom: 24 }}>
                {titulo}
            </Title>

            <Select size="large" {...selectProps} />

            <TablaCrud endpoint={endpoint} permisoCrud={tipoPermiso} />
        </div>
    );
};

ABM.displayName = "ABM";

export default React.memo(ABM);
