import { Flex, Form, Image, Input, InputNumber, Modal, Radio, Select, Switch, Typography } from "antd";
import { useEffect, useState } from "react";
import { api } from "../../../../servicios";
import { IPlc } from "../../../../types";
import { ModalCanalProps, TipoCanal, TipoVisualizacion } from "./types";

const { Item } = Form;
const { Option } = Select;

const ModalCanal: React.FC<ModalCanalProps> = ({ visible, onCancel, onSubmit, initialValues }) => {
    const [formularioCanal] = Form.useForm();
    const [plcs, setPlcs] = useState<IPlc[]>([]);
    const [formula, setFormula] = useState<string>("");
    const [cargandoListaPLCs, setCargandoListaPLCs] = useState<boolean>(false);
    const [mostrarFormula, setMostrarFormula] = useState<boolean>(initialValues?.lR3S === false);
    const [tipoCanalSeleccionado, setTipoCanalSeleccionado] = useState<TipoCanal>(
        initialValues?.tipo || TipoCanal.ANALOGICO
    );

    useEffect(() => {
        if (visible) cargarListaPLCs();
    }, [visible]);

    const cargarListaPLCs = async (): Promise<void> => {
        setCargandoListaPLCs(true);
        try {
            const respuestaApi = await api.get("/api/plcs/");
            setPlcs(respuestaApi.data);
        } catch (errorCarga) {
            console.error("Error al cargar la lista de PLCs:", errorCarga);
        } finally {
            setCargandoListaPLCs(false);
        }
    };

    useEffect(() => {
        if (visible) {
            // Resetear formulario primero
            formularioCanal.resetFields();

            if (initialValues) {
                console.log("Inicializando formulario con valores:", initialValues);
                // Establecer valores para edición
                formularioCanal.setFieldsValue(initialValues);
                setMostrarFormula(initialValues.lR3S !== true);
                setTipoCanalSeleccionado(initialValues.tipo || TipoCanal.ANALOGICO);
            } else {
                // Valores por defecto para crear nuevo
                setTipoCanalSeleccionado(TipoCanal.ANALOGICO);
                setMostrarFormula(true);
                setFormula("");

                // Establecer valores por defecto en el formulario
                formularioCanal.setFieldsValue({
                    nombre: "",
                    tipo: TipoCanal.ANALOGICO,
                    tipo_vista: TipoVisualizacion.RING,
                    valor_minimo: 0,
                    valor_maximo: 100,
                    max_sensor: 1023,
                    offset: 0,
                    escala: 1,
                    unidad: "",
                    posicion: 0,
                    lR3S: false,
                    formula: "",
                });
            }
        } else {
            // Cuando el modal se cierra, limpiar todo
            formularioCanal.resetFields();
            setMostrarFormula(true);
            setTipoCanalSeleccionado(TipoCanal.ANALOGICO);
            setFormula("");
        }
    }, [visible, initialValues, formularioCanal]);

    const manejarCambioRegla3Simple = (activarRegla3Simple: boolean): void => {
        setMostrarFormula(!activarRegla3Simple);
        if (activarRegla3Simple) actualizarFormula();
    };

    const manejarCambioTipoCanal = (tipoSeleccionado: TipoCanal): void => {
        setTipoCanalSeleccionado(tipoSeleccionado);
        if (tipoSeleccionado === TipoCanal.DIGITAL) setMostrarFormula(false);
    };

    const actualizarFormula = (): void => {
        const valores = formularioCanal.getFieldsValue();
        const valorMaximo = valores.valor_maximo || 100;
        const maxSensor = valores.max_sensor || 32764;
        const offset = valores.offset || 0;
        const escala = valores.escala || 1;

        let tresSimple = `(x * ${valorMaximo}) / ${maxSensor}`;
        let preview;

        // Si se usa regla de 3 simple, ajustamos la fórmula
        if (escala !== 100) tresSimple = `(${tresSimple}) * ${escala}`;

        // Si hay un offset, lo aplicamos
        if (offset !== 0) tresSimple = `(${tresSimple}) - ${Math.abs(offset)}`;

        preview = `f(x) = ${tresSimple}`;
        setFormula(preview);
    };

    const manejarEnvioFormulario = async (): Promise<void> => {
        try {
            const valoresFormulario = await formularioCanal.validateFields();
            // Aplicar valores por defecto para sensores digitales
            if (valoresFormulario.tipo === TipoCanal.DIGITAL) {
                // Resetea campos para digitales y aplica valores del formulario
                const valoresFinales = {
                    ...valoresFormulario,
                    nombre: valoresFormulario.nombre,
                    posicion: valoresFormulario.posicion,
                    plc: valoresFormulario.plc,
                    tipo: "DIGITAL", // Fuerza tipo DIGITAL
                    tipo_vista: TipoVisualizacion.CHART, // Fuerza tipo de visualización CHART
                    unidad: "ON/OFF",
                    valor_minimo: 0,
                    valor_maximo: 1,
                    offset: 0,
                    max_sensor: 100,
                    escala: 100,
                    lR3S: false,
                    formula: "x",
                };

                onSubmit(valoresFinales);
            } else {
                onSubmit(valoresFormulario);
            }
        } catch (errorValidacion) {
            console.error("Error en la validación del formulario:", errorValidacion);
            // La validación de Ant Design ya muestra los errores en la UI
        }
    };

    const esCampoVisible = (campo: string): boolean => {
        if (tipoCanalSeleccionado === TipoCanal.DIGITAL) {
            const camposDigitales = ["nombre", "tipo", "posicion", "plc"];
            return camposDigitales.includes(campo);
        }
        return true;
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
            <Form form={formularioCanal} layout="vertical" size="middle">
                {/* Fila 1: Nombre y Tipo de Sensor */}
                <Flex gap={16}>
                    <Item //Nombre del Canal
                        name="nombre"
                        label="Nombre del Canal"
                        initialValue={initialValues?.nombre || ""}
                        style={{ width: "50%" }}
                        rules={[
                            { required: true, message: "El nombre del canal es obligatorio" },
                            { max: 100, message: "El nombre no puede exceder 100 caracteres" },
                        ]}
                    >
                        <Input required placeholder="Ingrese el nombre descriptivo del canal" maxLength={100} />
                    </Item>

                    <Item //Tipo de Sensor
                        name="tipo"
                        label="Tipo de Sensor"
                        initialValue={initialValues?.tipo || TipoCanal.ANALOGICO}
                        rules={[{ required: true, message: "Seleccione el tipo de sensor" }]}
                        style={{ width: "50%" }}
                    >
                        <Select onChange={manejarCambioTipoCanal}>
                            <Option value={TipoCanal.ANALOGICO}>ANALÓGICO (Valores continuos)</Option>
                            <Option value={TipoCanal.DIGITAL}>DIGITAL (0 o 1)</Option>
                        </Select>
                    </Item>
                </Flex>

                {/* Fila 2: Tipo de Canal y Unidad de Medida */}
                <Flex gap={16}>
                    {esCampoVisible("tipo_vista") && (
                        <Item
                            name="tipo_vista"
                            label="Tipo de Visualización"
                            initialValue={TipoVisualizacion.RING}
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
                    )}
                    {esCampoVisible("lR3S") && (
                        <Item
                            name="lR3S"
                            label="Usar Regla de 3 Simple"
                            tooltip="Activar para usar regla de 3 simple automática en lugar de fórmula personalizada"
                            valuePropName="checked"
                            style={{ width: "50%" }}
                        >
                            <Flex align="center" gap={8}>
                                <Switch
                                    checked={initialValues?.lR3S || false}
                                    onChange={manejarCambioRegla3Simple}
                                    checkedChildren="Regla 3 Simple"
                                    unCheckedChildren="Fórmula"
                                />
                                {!mostrarFormula && <Typography.Text type="secondary">{formula}</Typography.Text>}
                            </Flex>
                        </Item>
                    )}
                </Flex>
                {mostrarFormula && (
                    <Item
                        name="formula"
                        label="Fórmula de Conversión"
                        initialValue={initialValues?.formula || ""}
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

                {/* Campos específicos para sensores analógicos */}
                {esCampoVisible("valor_minimo") && (
                    <>
                        {/* Fila 3: Valores Mínimo y Máximo Convertidos */}
                        <Flex gap={16}>
                            <Item
                                name="valor_minimo"
                                label="Valor Mínimo Convertido"
                                initialValue={0}
                                style={{ width: "33%" }}
                                tooltip="Valor mínimo una vez convertido."
                            >
                                <InputNumber style={{ width: "100%" }} placeholder="Valor mínimo" />
                            </Item>

                            <Item
                                name="valor_maximo"
                                label="Valor Máximo Convertido"
                                initialValue={100}
                                style={{ width: "33%" }}
                                tooltip="Valor máximo una vez convertido."
                            >
                                <InputNumber
                                    onChange={actualizarFormula}
                                    style={{ width: "100%" }}
                                    placeholder="Valor máximo"
                                />
                            </Item>
                            <Item
                                name="max_sensor"
                                label="Valor Máximo del Sensor"
                                initialValue={1023}
                                style={{ width: "34%" }}
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

                        {/* Fila 4: Offset y Máximo del Sensor */}
                        <Flex gap={16}>
                            <Item
                                name="offset"
                                label="Desplazamiento (Offset)"
                                initialValue={initialValues?.offset || 0}
                                style={{ width: "33%" }}
                                tooltip="Valor que se suma o resta al resultado de la conversión"
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: "100%" }}
                                    onChange={actualizarFormula}
                                    placeholder="Desplazamiento"
                                />
                            </Item>
                            <Item
                                name="escala"
                                label="Factor de Escala"
                                initialValue={initialValues?.escala || 1}
                                style={{ width: "33%" }}
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
                                name="unidad"
                                label="Unidad de Medida"
                                initialValue={initialValues?.unidad || ""}
                                style={{ width: "34%" }}
                                rules={[{ max: 10, message: "La unidad no puede exceder 10 caracteres" }]}
                            >
                                <Input
                                    placeholder="Ej: °C, BAR, KG, %"
                                    maxLength={10}
                                    disabled={tipoCanalSeleccionado === TipoCanal.DIGITAL}
                                />
                            </Item>
                        </Flex>
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
                        initialValue={initialValues?.plc_ip || undefined}
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
                            {plcs.map((plc: IPlc) => (
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
