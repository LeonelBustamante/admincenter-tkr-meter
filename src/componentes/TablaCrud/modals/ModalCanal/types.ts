export enum TipoCanal {
    ANALOGICO = "ANALOGICO",
    DIGITAL = "DIGITAL",
}

export enum TipoVisualizacion {
    CHART = "CHART",
    LIQUID = "LIQUID",
    RING = "RING",
}

export interface ValoresInicialesCanal {
    nombre?: string;
    tipo?: TipoCanal;
    tipo_vista?: TipoVisualizacion;
    unidad?: string;
    valor_minimo?: number;
    valor_maximo?: number;
    offset?: number;
    max_sensor?: number;
    escala?: number;
    posicion?: number;
    lR3S?: boolean;
    formula?: string;
    plc_ip?: string;
    plc?: number;
    dtfechacreacion?: any;
}

export interface ModalCanalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    initialValues?: ValoresInicialesCanal;
}
