import { Image, Layout, Result, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BotonCerrarSesion, FormularioLogin, MenuNavegacion, RutaPrivada } from "./componentes";
import { ABM, Reporte, PaginaPrincipal, RT, Usuarios } from "./paginas";
import { api } from "./servicios";
import { IUsuario } from "./types";

const { Header, Content } = Layout;
const { Text } = Typography;

const App: React.FC = () => {
    const [usuario, setUsuario] = useState<IUsuario | null>(null);
    const [cargandoUsuario, setCargandoUsuario] = useState(true);

    // Función para cargar el usuario actual
    const cargarUsuarioActual = () => {
        setCargandoUsuario(true);
        api.get("/api/usuario_actual/")
            .then((respuesta) => {
                if (respuesta.data.username) {
                    setUsuario(respuesta.data);
                } else {
                    setUsuario(null);
                }
            })
            .catch(() => setUsuario(null))
            .finally(() => setCargandoUsuario(false));
    };

    useEffect(() => {
        cargarUsuarioActual();
    }, []);

    // Manejador de inicio de sesión que actualiza el estado correctamente
    const handleLogin = (nuevoUsuario: IUsuario | null) => {
        if (nuevoUsuario && nuevoUsuario.username) {
            // Si el usuario no tiene permisos definidos, inicializarlos con valores por defecto
            if (!nuevoUsuario.permisos) {
                nuevoUsuario.permisos = {
                    crud: "NO",
                    real_time: "NO",
                    gestion_usuarios: "NO",
                    generar_reportes: "NO",
                };
            }
            setUsuario(nuevoUsuario);
        } else {
            setUsuario(null);
        }
    };

    if (cargandoUsuario) {
        return (
            <div
                style={{
                    minWidth: "100vw",
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Result icon={<LoadingOutlined />} title="Cargando..." />
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Layout style={{ width: "100vw", height: "100vh" }}>
                <Header
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 20px",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <Image src="/logo.svg" preview={false} style={{ width: 150, marginRight: "20px" }} />
                    </div>
                    {usuario && usuario.permisos && (
                        <>
                            <MenuNavegacion permisos={usuario.permisos} />
                            <Text
                                style={{
                                    color: "white",
                                    width: "500px",
                                    textAlign: "end",
                                    marginRight: "20px",
                                }}
                            >
                                {usuario.first_name && usuario.last_name
                                    ? `Bienvenido, ${usuario.nombre} ${usuario.apellido}`
                                    : `Bienvenido, ${usuario.username}`}
                            </Text>
                            <BotonCerrarSesion onCerrarSesion={() => setUsuario(null)} />
                        </>
                    )}
                </Header>
                <Content style={{ padding: "24px" }}>
                    <Routes>
                        <Route
                            path="/login"
                            element={usuario ? <Navigate to="/" /> : <FormularioLogin onLogin={handleLogin} />}
                        />
                        <Route element={<RutaPrivada isAutenticado={!!usuario} />}>
                            <Route
                                path="/"
                                element={<PaginaPrincipal usuario={usuario!} onCerrarSesion={() => setUsuario(null)} />}
                            />
                            <Route
                                path="/abm"
                                element={
                                    usuario && usuario.permisos && usuario.permisos.crud !== "NO" ? (
                                        <ABM tipoPermiso={usuario.permisos.crud} />
                                    ) : (
                                        <Navigate to="/" />
                                    )
                                }
                            />
                            <Route
                                path="/usuarios"
                                element={
                                    usuario && usuario.permisos ? (
                                        <Usuarios
                                            usuario={usuario}
                                            permiteGestion={usuario.permisos.gestion_usuarios === "SI"}
                                        />
                                    ) : (
                                        <Navigate to="/" />
                                    )
                                }
                            />
                            <Route
                                path="/grafico"
                                element={
                                    usuario && usuario.permisos && usuario.permisos.generar_reportes === "SI" ? (
                                        <Reporte user={usuario} />
                                    ) : (
                                        <Navigate to="/" />
                                    )
                                }
                            />
                            <Route
                                path="/rt"
                                element={
                                    usuario && usuario.permisos && usuario.permisos.real_time !== "NO" ? (
                                        <RT tipoPermiso={usuario.permisos.real_time} />
                                    ) : (
                                        <Navigate to="/" />
                                    )
                                }
                            />
                        </Route>
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Content>
            </Layout>
        </BrowserRouter>
    );
};

export default App;
