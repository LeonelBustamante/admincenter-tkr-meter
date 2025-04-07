// MyDocument.tsx
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { Dayjs } from "dayjs";
import React from "react";
import { IUsuario } from "../../types";

// Definición de la interfaz para los datos recibidos desde el formulario
export interface IValoresParaPDF {
    nombre_equipo: string;
    fecha: [Dayjs, Dayjs];
    nombre_canal: string;
    chartUrl: string;
}

interface MyDocumentProps {
    datos: IValoresParaPDF | null;
    usuario: IUsuario | null;
}

const MyDocument: React.FC<MyDocumentProps> = ({ datos, usuario }) => {
    const nombreEquipo = datos?.nombre_equipo || "Sin nombre";
    const nombreSensor = datos?.nombre_canal || "Sin nombre";
    const fechaInicio = datos?.fecha[0].format("DD/MM/YYYY HH:mm") || "Sin fecha";
    const fechaFin = datos?.fecha[1].format("DD/MM/YYYY HH:mm") || "Sin fecha";

    return (
        <Document>
            <Page
                size="A4"
                bookmark={{ title: "Informe de PH" }}
                orientation="landscape"
                style={{
                    padding: "1.5cm 1.32cm 1.5cm 2.3cm",
                    backgroundColor: "white",
                }}
            >
                {/* Header */}
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        border: "1px solid #ff0000",
                        width: "100%",
                        height: "1.50cm",
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            borderRight: "1px solid #ff0000",
                        }}
                    >
                        <Image src="/logo.png" style={{ height: "70%" }} />
                    </View>
                    <View
                        style={{
                            flex: 3,
                            height: "auto",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            borderRight: "1px solid #ff0000",
                        }}
                    >
                        <Text style={{ textAlign: "center", fontSize: 12 }}> INFORME DE PH </Text>
                    </View>
                    <View
                        style={{
                            flex: 2,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                height: "auto",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                borderBottom: "1px solid #ff0000",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    height: "auto",
                                    paddingLeft: 5,
                                }}
                            >
                                Equipo: {nombreEquipo}
                            </Text>
                        </View>
                        <View
                            style={{
                                flex: 1,
                                height: "auto",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    height: "auto",
                                    paddingLeft: 5,
                                }}
                            >
                                Operador: {usuario != null ? `${usuario?.username}` : "Sin nombre"}
                            </Text>
                        </View>
                    </View>
                </View>

                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        borderLeft: "1px solid #ff0000",
                        borderRight: "1px solid #ff0000",
                        borderBottom: "1px solid #ff0000",
                        width: "100%",
                        height: "1.50cm",
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            height: "auto",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            borderRight: "1px solid #ff0000",
                        }}
                    >
                        <Text
                            style={{
                                textAlign: "left",
                                paddingLeft: 5,

                                fontSize: 10,
                            }}
                        >
                            Sensor: {nombreSensor}
                        </Text>
                    </View>

                    <View
                        style={{
                            flex: 1,
                            height: "auto",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }}
                    >
                        <Text
                            style={{
                                textAlign: "left",
                                paddingLeft: 5,
                                fontSize: 10,
                            }}
                        >
                            Fecha inicio: {fechaInicio}
                        </Text>
                        <Text
                            style={{
                                textAlign: "left",

                                paddingLeft: 5,
                                fontSize: 10,
                            }}
                        >
                            Fecha fin: {fechaFin}
                        </Text>
                    </View>
                </View>

                {/* Body */}

                <View
                    style={{
                        flex: 1,
                        height: "auto",
                        width: "100%",
                    }}
                >
                    {datos?.chartUrl && <Image style={{ width: "100%" }} src={datos.chartUrl} />}
                </View>

                <Text
                    style={{
                        position: "absolute",
                        bottom: 30,
                        left: 30,
                        right: 30,
                        textAlign: "center",
                        fontSize: 8,
                        color: "#4A5568",
                    }}
                >
                    Tacker S.R.L{"\n"}Julio Salto y Perón Juan D. - Chacra 2 - Colonia Marconetti - 8324 - Cipolletti,
                    Argentina Tel/Fax: +54-299-4786310 - www.tackertools.com
                </Text>
            </Page>
        </Document>
    );
};

export default MyDocument;
