import { Flex, Form, Image, Input, InputNumber, Modal, Radio, Select, Switch, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { api } from "../../../servicios";

const { Item } = Form;
const { Option } = Select;

/**
 * Tipos disponibles para los canales de sensores
 */
enum TipoCanal {
    ANALOGICO = "ANALOGICO",
    DIGITAL = "DIGITAL",
}

/**
 * Tipos de visualización disponibles para los gráficos
 */
enum TipoVisualizacion {
    CHART = "CHART",
    GAUGE = "GAUGE",
    LIQUID = "LIQUID",
    RING = "RING",
}

/**
 * Interfaz para definir la estructura de datos de un PLC
 */
interface PlcData {
    id: number;
    ip: string;
}

interface ValoresInicialesCanal {
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
    dtfechacreacion?: any;
}

/**
 * Props del componente ModalCanal
 */
interface ModalCanalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    initialValues?: ValoresInicialesCanal;
}

/**
 * Componente modal para crear/editar canales de sensores
 * Maneja tanto sensores analógicos como digitales con diferentes configuraciones
 */
const ModalCanal: React.FC<ModalCanalProps> = ({ visible, onCancel, onSubmit, initialValues }) => {
    const [formularioCanal] = Form.useForm();
    const [formula, setFormula] = useState<string>("");
    const [mostrarCampoFormula, setMostrarCampoFormula] = useState<boolean>(initialValues?.lR3S === false);

    const [listaPlcs, setListaPlcs] = useState<PlcData[]>([]);
    const [cargandoListaPLCs, setCargandoListaPLCs] = useState<boolean>(false);

    const [tipoCanalSeleccionado, setTipoCanalSeleccionado] = useState<TipoCanal>(
        initialValues?.tipo || TipoCanal.ANALOGICO
    );

    /**
     * Carga la lista de PLCs disponibles desde la API
     * Se ejecuta cuando el modal se vuelve visible
     */
    useEffect(() => {
        if (visible) {
            cargarListaPLCs();
        }
    }, [visible]);

    /**
     * Función para obtener los PLCs desde el servidor
     */
    const cargarListaPLCs = async (): Promise<void> => {
        setCargandoListaPLCs(true);
        try {
            const respuestaApi = await api.get("/api/plcs/");
            setListaPlcs(respuestaApi.data);
        } catch (errorCarga) {
            console.error("Error al cargar la lista de PLCs:", errorCarga);
        } finally {
            setCargandoListaPLCs(false);
        }
    };

    /**
     * Efecto para resetear y cargar el formulario cuando cambia la visibilidad o valores iniciales
     */
    useEffect(() => {
        if (visible) {
            formularioCanal.resetFields();

            if (initialValues) {
                const valoresFormulario = { ...initialValues };

                if (valoresFormulario.dtfechacreacion) {
                    valoresFormulario.dtfechacreacion = dayjs(valoresFormulario.dtfechacreacion);
                }

                formularioCanal.setFieldsValue(valoresFormulario);

                setMostrarCampoFormula(valoresFormulario.lR3S === false);
                setTipoCanalSeleccionado(valoresFormulario.tipo || TipoCanal.ANALOGICO);
            } else {
                setTipoCanalSeleccionado(TipoCanal.ANALOGICO);
                setMostrarCampoFormula(true);
            }
        }
    }, [visible, initialValues, formularioCanal]);

    /**
     * Maneja el cambio del switch de Regla de 3 Simple
     * @param activarRegla3Simple - Estado del switch
     */
    const manejarCambioRegla3Simple = (activarRegla3Simple: boolean): void => {
        setMostrarCampoFormula(!activarRegla3Simple);

        // Si se activa R3S, establecer fórmula por defecto
        if (activarRegla3Simple) {
            formularioCanal.setFieldValue("formula", "x");
        }
    };

    /**
     * Maneja el cambio del tipo de canal (Analógico/Digital)
     * @param tipoSeleccionado - Tipo de canal seleccionado
     */
    const manejarCambioTipoCanal = (tipoSeleccionado: TipoCanal): void => {
        setTipoCanalSeleccionado(tipoSeleccionado);

        // Establecer valores por defecto según el tipo
        if (tipoSeleccionado === TipoCanal.DIGITAL) {
            formularioCanal.setFieldsValue({
                valor_minimo: 0,
                valor_maximo: 1,
                unidad: "ON/OFF",
                offset: 0,
                max_sensor: 100,
                escala: 100,
                lR3S: false,
                formula: "x",
                tipo_vista: TipoVisualizacion.CHART, // Los sensores digitales solo usan gráfico de líneas
            });
            setMostrarCampoFormula(false);
        }
    };

    /**
     * Valores por defecto para sensores digitales
     */
    const valoresPorDefectoDigital = {
        valor_minimo: 0,
        valor_maximo: 1,
        unidad: "ON/OFF",
        offset: 0,
        max_sensor: 100,
        escala: 100,
        lR3S: false,
        formula: "x",
    };

    const generarFormulaLatex = (): string => {
        const valores = formularioCanal.getFieldsValue();
        const valorMaximo = valores.valor_maximo || 100;
        const maxSensor = valores.max_sensor || 1023;
        const offset = valores.offset || 0;
        const escala = valores.escala || 1;

        let latex = `\\frac{x \\times ${valorMaximo}}{${maxSensor}}`;

        // Agregar factor de escala si es diferente de 1
        if (escala !== 1 && escala !== 100) {
            latex = `\\left(${latex}\\right) \\times ${escala}`;
        }

        // Agregar offset si es diferente de 0
        if (offset !== 0) {
            if (offset > 0) {
                latex = `${latex} + ${offset}`;
            } else {
                latex = `${latex} - ${Math.abs(offset)}`;
            }
        }

        return `f(x) = ${latex}`;
    };

    const actualizarFormula = (): void => {
        const valores = formularioCanal.getFieldsValue();
        const valorMaximo = valores.valor_maximo || 100;
        const maxSensor = valores.max_sensor || 32764;
        const offset = valores.offset || 0;
        const escala = valores.escala || 1;

        let tresSimple = `(x * ${valorMaximo}) / ${maxSensor}`;
        let res;

        if (escala !== 100) {
            tresSimple = `(${tresSimple}`;
            tresSimple += `) * ${escala}`;
        }

        if (offset !== 0) {
            tresSimple = `(${tresSimple})`;
            if (offset > 0) {
                tresSimple += ` + ${offset}`;
            } else {
                tresSimple += ` - ${Math.abs(offset)}`;
            }
        }

        res = `f(x) = ${tresSimple}`;
        setFormula(res);
    };

    /**
     * Maneja el envío del formulario con validación y valores por defecto
     */
    const manejarEnvioFormulario = async (): Promise<void> => {
        try {
            const valoresValidados = await formularioCanal.validateFields();

            // Formatear fecha si existe
            if (valoresValidados.dtfechacreacion) {
                valoresValidados.dtfechacreacion = valoresValidados.dtfechacreacion.format("YYYY-MM-DD HH:mm:ss");
            }

            // Aplicar valores por defecto para sensores digitales
            if (valoresValidados.tipo === TipoCanal.DIGITAL) {
                const valoresFinales = {
                    ...valoresValidados,
                    ...valoresPorDefectoDigital,
                    // Mantener solo los valores específicos del formulario para digitales
                    nombre: valoresValidados.nombre,
                    tipo: valoresValidados.tipo,
                    tipo_vista: TipoVisualizacion.CHART, // Forzar chart para digitales
                    posicion: valoresValidados.posicion,
                    plc: valoresValidados.plc,
                    dtfechacreacion: valoresValidados.dtfechacreacion,
                };

                onSubmit(valoresFinales);
            } else {
                onSubmit(valoresValidados);
            }
        } catch (errorValidacion) {
            console.error("Error en la validación del formulario:", errorValidacion);
            // La validación de Ant Design ya muestra los errores en la UI
        }
    };

    /**
     * Determina si un campo debe ser visible según el tipo de canal
     */
    const esCampoVisible = (campo: string): boolean => {
        if (tipoCanalSeleccionado === TipoCanal.DIGITAL) {
            const camposDigitales = ["nombre", "tipo", "posicion", "plc", "tipo_vista"];
            return camposDigitales.includes(campo);
        }
        return true; // Para analógicos, mostrar todos los campos
    };

    return (
        <Modal
            title={`${initialValues ? "Editar" : "Crear"} Canal de Sensor`}
            open={visible}
            onCancel={onCancel}
            onOk={manejarEnvioFormulario}
            width="80%"
            maskClosable={false}
            okText={initialValues ? "Actualizar" : "Crear"}
            cancelText="Cancelar"
        >
            <Form form={formularioCanal} layout="vertical" size="large" requiredMark="optional">
                {/* Fila 1: Nombre y Tipo de Gráfico */}
                <Flex gap={16}>
                    <Item
                        name="nombre"
                        label="Nombre del Canal"
                        style={{ width: "50%" }}
                        rules={[
                            { required: true, message: "El nombre del canal es obligatorio" },
                            { max: 100, message: "El nombre no puede exceder 100 caracteres" },
                        ]}
                    >
                        <Input placeholder="Ingrese el nombre descriptivo del canal" maxLength={100} />
                    </Item>

                    <Item
                        name="tipo_vista"
                        label="Tipo de Visualización"
                        initialValue={TipoVisualizacion.GAUGE}
                        rules={[{ required: true, message: "Seleccione un tipo de visualización" }]}
                        style={{ width: "50%" }}
                    >
                        <Radio.Group disabled={tipoCanalSeleccionado === TipoCanal.DIGITAL}>
                            <Radio value={TipoVisualizacion.CHART}>
                                <Flex align="center">
                                    <Image
                                        src="/chart.png"
                                        preview={false}
                                        style={{ width: 80, height: "auto", marginRight: 8 }}
                                        alt="Gráfico de líneas"
                                    />
                                    <span>Gráfico</span>
                                </Flex>
                            </Radio>
                            <Radio value={TipoVisualizacion.GAUGE}>
                                <Flex align="center">
                                    <Image
                                        src="/gauge.png"
                                        preview={false}
                                        style={{ width: 80, height: "auto", marginRight: 8 }}
                                        alt="Medidor de aguja"
                                    />
                                    <span>Medidor</span>
                                </Flex>
                            </Radio>
                            <Radio value={TipoVisualizacion.LIQUID}>
                                <Flex align="center">
                                    <Image
                                        src="/liquid.png"
                                        preview={false}
                                        style={{ width: 80, height: "auto", marginRight: 8 }}
                                        alt="Medidor líquido"
                                    />
                                    <span>Líquido</span>
                                </Flex>
                            </Radio>
                            <Radio value={TipoVisualizacion.RING}>
                                <Flex align="center">
                                    <Image
                                        src="/ring.png"
                                        preview={false}
                                        style={{ width: 80, height: "auto", marginRight: 8 }}
                                        alt="Medidor circular"
                                    />
                                    <span>Circular</span>
                                </Flex>
                            </Radio>
                        </Radio.Group>
                        {tipoCanalSeleccionado === TipoCanal.DIGITAL && (
                            <div style={{ marginTop: 8, color: "#666", fontSize: "12px" }}>
                                Los sensores digitales solo utilizan gráfico de líneas para mostrar estados ON/OFF
                            </div>
                        )}
                    </Item>
                </Flex>

                {/* Fila 2: Tipo de Canal y Unidad de Medida */}
                <Flex gap={16}>
                    <Item
                        name="tipo"
                        label="Tipo de Sensor"
                        initialValue={TipoCanal.ANALOGICO}
                        rules={[{ required: true, message: "Seleccione el tipo de sensor" }]}
                        style={{ width: "50%" }}
                    >
                        <Select onChange={manejarCambioTipoCanal}>
                            <Option value={TipoCanal.ANALOGICO}>ANALÓGICO (Valores continuos)</Option>
                            <Option value={TipoCanal.DIGITAL}>DIGITAL (0 o 1)</Option>
                        </Select>
                    </Item>

                    {esCampoVisible("unidad") && (
                        <Item
                            name="unidad"
                            label="Unidad de Medida"
                            style={{ width: "50%" }}
                            rules={[{ max: 10, message: "La unidad no puede exceder 10 caracteres" }]}
                        >
                            <Input
                                placeholder="Ej: °C, BAR, KG, %"
                                maxLength={10}
                                disabled={tipoCanalSeleccionado === TipoCanal.DIGITAL}
                            />
                        </Item>
                    )}
                </Flex>

                {/* Campos específicos para sensores analógicos */}
                {esCampoVisible("valor_minimo") && (
                    <>
                        {/* Fila 3: Valores Mínimo y Máximo Convertidos */}
                        <Flex gap={16}>
                            <Item
                                name="valor_minimo"
                                label="Valor Mínimo Convertido"
                                initialValue={0}
                                style={{ width: "50%" }}
                                tooltip="Valor mínimo una vez convertido."
                            >
                                <InputNumber style={{ width: "100%" }} placeholder="Valor mínimo" />
                            </Item>

                            <Item
                                name="valor_maximo"
                                label="Valor Máximo Convertido"
                                initialValue={100}
                                style={{ width: "50%" }}
                                tooltip="Valor máximo una vez convertido."
                            >
                                <InputNumber
                                    onChange={actualizarFormula}
                                    style={{ width: "100%" }}
                                    placeholder="Valor máximo"
                                />
                            </Item>
                        </Flex>

                        {/* Fila 4: Offset y Máximo del Sensor */}
                        <Flex gap={16}>
                            <Item
                                name="offset"
                                label="Desplazamiento (Offset)"
                                initialValue={0}
                                style={{ width: "50%" }}
                                tooltip="Valor que se suma o resta al resultado de la conversión"
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    onChange={actualizarFormula}
                                    step={0.01}
                                    placeholder="Desplazamiento"
                                />
                            </Item>

                            <Item
                                name="max_sensor"
                                label="Valor Máximo del Sensor"
                                initialValue={1023}
                                style={{ width: "50%" }}
                                tooltip="Valor máximo que puede leer el sensor (ej: 1023 para ADC de 10 bits)"
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    onChange={actualizarFormula}
                                    min={1}
                                    placeholder="Valor máximo del sensor"
                                />
                            </Item>
                        </Flex>

                        {/* Fila 5: Escala y Configuración de Conversión */}
                        <Flex gap={16}>
                            <Item
                                name="escala"
                                label="Factor de Escala"
                                initialValue={1}
                                style={{ width: "50%" }}
                                tooltip="Factor multiplicador para ajustar la escala de conversión"
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    step={0.00001}
                                    precision={5}
                                    onChange={actualizarFormula}
                                    placeholder="Factor de escala"
                                />
                            </Item>

                            <Item
                                name="lR3S"
                                label="Usar Regla de 3 Simple"
                                tooltip="Activar para usar regla de 3 simple automática en lugar de fórmula personalizada"
                                valuePropName="checked"
                                style={{ width: "50%" }}
                            >
                                <Flex align="center" gap={8}>
                                    <Switch
                                        onChange={manejarCambioRegla3Simple}
                                        checkedChildren="R3S"
                                        unCheckedChildren="Fórmula"
                                    />
                                    {!mostrarCampoFormula && (
                                        <Typography.Text type="secondary">{formula}</Typography.Text>
                                    )}
                                </Flex>
                            </Item>
                        </Flex>

                        {mostrarCampoFormula && (
                            <Item
                                name="formula"
                                label="Fórmula de Conversión"
                                rules={[
                                    {
                                        required: !formularioCanal.getFieldValue("lR3S"),
                                        message: "Ingrese una fórmula de conversión válida",
                                    },
                                ]}
                                tooltip="Use 'x' para representar el valor leído del sensor. Ej: (x * 0.1) + 5"
                            >
                                <Input placeholder="Ej: x*2+5 (donde 'x' es el valor del sensor)" maxLength={200} />
                            </Item>
                        )}
                    </>
                )}

                {/* Fila Final: Posición y PLC */}
                <Flex gap={16}>
                    <Item
                        name="posicion"
                        label="Posición en la Trama de Datos"
                        initialValue={0}
                        style={{ width: "50%" }}
                        rules={[{ required: true, message: "La posición en la trama es obligatoria" }]}
                        tooltip="Posición del dato en la trama de comunicación (empezando desde 0)"
                    >
                        <InputNumber style={{ width: "100%" }} min={0} placeholder="Posición en trama" />
                    </Item>

                    <Item
                        name="plc"
                        label="PLC Asociado"
                        rules={[{ required: true, message: "Seleccione el PLC que controlará este canal" }]}
                        style={{ width: "50%" }}
                        tooltip="Controlador PLC del cual se leerán los datos"
                    >
                        <Select
                            placeholder="Seleccione el PLC"
                            loading={cargandoListaPLCs}
                            showSearch
                            optionFilterProp="children"
                        >
                            {listaPlcs.map((plc: PlcData) => (
                                <Option key={plc.id} value={plc.id}>
                                    PLC: {plc.ip}
                                </Option>
                            ))}
                        </Select>
                    </Item>
                </Flex>
            </Form>
        </Modal>
    );
};

export default ModalCanal;
