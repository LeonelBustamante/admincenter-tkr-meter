import { Button, Space, Table, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { api } from "../../servicios";

interface TablaCrudProps {
    endpoint: string;
    permisoCrud: string;
}

interface Elemento {
    id: number;
    [key: string]: any;
}

const TablaCrud: React.FC<TablaCrudProps> = ({ endpoint, permisoCrud }) => {
    const [cargando, setCargando] = useState<boolean>(false);
    const [datos, setDatos] = useState<Elemento[]>([]);
    const [messageAPI, contextHolder] = message.useMessage();

    const formatearHeaderTable = (key: string) => {
        let respuesta = key.charAt(0).toUpperCase() + key.slice(1);
        respuesta = respuesta.replace("_", " ");
        return respuesta;
    };

    const cargarDatos = () => {
        setCargando(true);
        api.get(endpoint)
            .then((response) => {
                setDatos(response.data);
            })
            .catch(() => {
                messageAPI.error("Error al cargar datos");
            })
            .finally(() => {
                setCargando(false);
            });
    };

    useEffect(() => {
        cargarDatos();
    }, [endpoint]);

    // Generamos las columnas de forma dinámica basadas en la primera fila de datos
    const columnas = Object.keys(datos[0] || {})
        .filter((key) => key !== "id")
        .map((key) => ({
            title: formatearHeaderTable(key),
            dataIndex: key,
            key: key,
            render: (valor: any) => {
                if (key.toLowerCase().includes("fecha") && valor) {
                    return dayjs(valor).format("DD/MM/YYYY HH:mm:ss");
                }
                return valor;
            },
        }));

    // Agregamos columna de acciones

    {
        endpoint.includes("ubicaciones") &&
            columnas.push({
                title: "Acciones",
                key: "acciones",
                render: (_: any, registro: Elemento) => {
                    return (
                        <Space>
                            {endpoint.includes("ubicaciones") && (
                                <Button
                                    type="link"
                                    onClick={() =>
                                        window.open(
                                            `https://www.google.com/maps/search/?api=1&query=${registro.latitud},${registro.longitud}`
                                        )
                                    }
                                >
                                    Ver en mapa
                                </Button>
                            )}
                        </Space>
                    );
                },
            });
    }

    return (
        <>
            {contextHolder}
            {permisoCrud === "SI" && (
                <Button onClick={() => window.open(`/admin/${endpoint.split("/")[2]}`, "_blank")}>
                    Crear nuevo registro
                </Button>
            )}
            <Table
                dataSource={datos}
                columns={columnas.map((col) => {
                    if (col.key === "acciones") {
                        return {
                            ...col,
                            render: (_: any, registro: Elemento) => (
                                <Space>
                                    {endpoint.includes("ubicaciones") && (
                                        <Button
                                            type="link"
                                            onClick={() =>
                                                window.open(
                                                    `https://www.google.com/maps/search/?api=1&query=${registro.latitud},${registro.longitud}`
                                                )
                                            }
                                        >
                                            Ver en mapa
                                        </Button>
                                    )}
                                </Space>
                            ),
                        };
                    }
                    return col;
                })}
                rowKey="id"
                loading={cargando}
            />
        </>
    );
};

export default TablaCrud;
