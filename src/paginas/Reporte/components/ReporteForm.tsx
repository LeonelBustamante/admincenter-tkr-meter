import { Button, DatePicker, Flex, Form, FormInstance, Row, Select, Spin, Typography, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useState, useEffect } from "react";
import { api } from "../../../servicios";
import { ICanal, IEquipo } from "../../../types";
import { DownOutlined } from "@ant-design/icons";

const { Item } = Form;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const MAX_COUNT = 3;

interface ReporteFormProps {
    equipos: IEquipo[];
    onFinish: (values: any) => void;
    form: FormInstance;
    setCanalSeleccionado: (canales: ICanal[]) => void;
    setEquipoSeleccionado: (equipo: IEquipo) => void;
}

const ReporteForm: React.FC<ReporteFormProps> = ({
    setEquipoSeleccionado,
    setCanalSeleccionado,
    equipos,
    onFinish,
    form,
}) => {
    const [conultandoRangoFecha, setConsultandoRangoFecha] = useState<boolean>(false);
    const [conultandoCanalPorEquipo, setConsultandoCanalPorEquipo] = useState<boolean>(false);

    const [mostrarSeleccionarFecha, setMostrarSeleccionarFecha] = useState<boolean>(false);
    const [mostrarSeleccionarCanal, setMostrarSeleccionarCanal] = useState<boolean>(false);

    const [canalesDisponibles, setCanalesDisponibles] = useState<ICanal[]>([]);
    const [canalesOptions, setCanalesOptions] = useState<{ label: string; value: number }[]>([]);
    const [rangoFechas, setRangoFechas] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [messageApi, contextHolder] = message.useMessage();
    const [canalesSeleccionados, setCanalesSeleccionados] = useState<number[]>([]);

    const suffix = (
        <>
            <span>
                {canalesSeleccionados.length} / {MAX_COUNT}
            </span>
            <DownOutlined />
        </>
    );

    // Cuando cambian los canales seleccionados, actualizar el componente padre
    useEffect(() => {
        if (canalesSeleccionados.length > 0 && canalesDisponibles.length > 0) {
            const canalesObjetos = canalesSeleccionados
                .map((id) => canalesDisponibles.find((canal) => canal.id === id))
                .filter((canal) => canal !== undefined) as ICanal[];

            setCanalSeleccionado(canalesObjetos);
        } else {
            setCanalSeleccionado([]);
        }
    }, [canalesSeleccionados, canalesDisponibles]);

    // desarmamos equipos y lo dejamos como un array de objetos con label y value
    const equiposOptions: { label: string; value: number }[] = equipos.map((equipo) => ({
        label: equipo.nombre,
        value: equipo.id,
    }));

    // metodo que maneja el cambio en el select de equipo y consulta a la base de datos
    const manejarCambioEquipo = (id_equipo: number) => {
        setConsultandoCanalPorEquipo(true);
        setEquipoSeleccionado(equipos.find((equipo: IEquipo) => equipo.id === id_equipo) as IEquipo);

        // Resetear los canales seleccionados al cambiar de equipo
        setCanalesSeleccionados([]);
        form.setFieldValue("canal", []);

        api.get(`/api/canales/por_equipo/?equipo_id=${id_equipo}`)
            .then((response) => {
                setCanalesDisponibles(response.data);
                const canalesOptions = response.data.map((canal: Partial<ICanal>) => ({
                    label: canal.nombre,
                    value: canal.id,
                }));
                setCanalesOptions(canalesOptions);
            })
            .catch(() => {
                messageApi.error("Error al cargar canales para el equipo seleccionado");
            })
            .finally(() => {
                setConsultandoCanalPorEquipo(false);
                setMostrarSeleccionarCanal(true);
            });
    };

    // metodo que maneja el cambio en el select de canal y consulta a la base de datos
    const manejarCambioCanal = (ids_canales: number[]) => {
        setCanalesSeleccionados(ids_canales);

        // Si no hay canales seleccionados, ocultar la sección de fechas
        if (ids_canales.length === 0) {
            setMostrarSeleccionarFecha(false);
            return;
        }

        setConsultandoRangoFecha(true);

        // Consultar el rango de fechas para el primer canal seleccionado
        // Esto es una simplificación - podrías querer encontrar el rango que funcione para todos los canales
        const primerCanalId = ids_canales[0];

        api.get(`/api/valores/rango_fechas/?idcanal=${primerCanalId}`)
            .then((response) => {
                setRangoFechas([dayjs(response.data.fechaInicio), dayjs(response.data.fechaFin)]);
            })
            .catch(() => {
                messageApi.error("Error al cargar rango de fechas posibles");
            })
            .finally(() => {
                setConsultandoRangoFecha(false);
                setMostrarSeleccionarFecha(true);
            });
    };

    return (
        <>
            {contextHolder}
            <Row>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    style={{ width: "100%" }}
                    initialValues={{
                        fecha: [rangoFechas[0], rangoFechas[1]],
                    }}
                >
                    <Item label="Equipo" name="equipo" required>
                        <Select
                            size="large"
                            options={equiposOptions}
                            placeholder="Seleccione un equipo"
                            onChange={manejarCambioEquipo}
                            loading={conultandoCanalPorEquipo}
                        />
                    </Item>

                    {mostrarSeleccionarCanal ? (
                        <Item label="Canal" name="canal" required>
                            <Select
                                mode="multiple"
                                maxCount={MAX_COUNT}
                                suffixIcon={suffix}
                                size="large"
                                options={canalesOptions}
                                placeholder="Seleccione hasta 3 canales"
                                onChange={manejarCambioCanal}
                                loading={conultandoRangoFecha}
                            />
                        </Item>
                    ) : (
                        <Flex>
                            <Spin spinning={conultandoCanalPorEquipo} />
                            {conultandoCanalPorEquipo && (
                                <Text style={{ marginLeft: 10 }} strong>
                                    Consultando canales...
                                </Text>
                            )}
                        </Flex>
                    )}

                    {mostrarSeleccionarFecha ? (
                        <Flex align="center">
                            <Item label="Fecha" name="fecha" required>
                                <RangePicker
                                    showTime={{ format: "HH:mm:ss" }}
                                    allowEmpty
                                    showNow
                                    disabledDate={(current) => {
                                        if (rangoFechas[0] && rangoFechas[1]) {
                                            return current && (current < rangoFechas[0] || current > rangoFechas[1]);
                                        }
                                        return false;
                                    }}
                                    size="large"
                                />
                            </Item>

                            <Item label=" " style={{ marginLeft: 20 }}>
                                <Button type="primary" htmlType="submit" disabled={canalesSeleccionados.length === 0}>
                                    Vista Previa
                                </Button>
                            </Item>
                        </Flex>
                    ) : (
                        <Flex>
                            <Spin spinning={conultandoRangoFecha} />
                            {conultandoRangoFecha && (
                                <Text style={{ marginLeft: 10 }} strong>
                                    Consultando rango de fechas...
                                </Text>
                            )}
                        </Flex>
                    )}
                </Form>
            </Row>
        </>
    );
};

export default ReporteForm;
