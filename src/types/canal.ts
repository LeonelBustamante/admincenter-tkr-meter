export interface ICanal {
    id: number;
    tipo: string;
    unidad: string;
    nombre: string;
    fecha_creacion: string;
    posicion: number;
    max_sensor: number;
    escala: null | number;
    formula: string;
    valor_minimo: number;
    valor_maximo: number;
    offset: number;
    lR3S: boolean;
    plc_ip: string;
    tipo_vista: string;
}
