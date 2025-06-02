import { LoadingOutlined } from "@ant-design/icons";
import { Flex, Image, Layout, Result, Typography } from "antd";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BotonCerrarSesion, FormularioLogin, MenuNavegacion, RutaPrivada } from "./componentes";
import { ABM, PaginaPrincipal, Reporte, RT, Usuarios } from "./paginas";
import { api } from "./servicios";
import { IUsuario, TipoPermiso } from "./types";

const { Header, Content } = Layout;
const { Text } = Typography;

interface AppState {
    usuario: IUsuario | null;
    cargandoUsuario: boolean;
}

interface PermisosPorDefecto {
    crud: "NO";
    real_time: "NO";
    gestion_usuarios: "NO";
    generar_reportes: "NO";
}

const PERMISOS_POR_DEFECTO: PermisosPorDefecto = {
    crud: "NO",
    real_time: "NO",
    gestion_usuarios: "NO",
    generar_reportes: "NO",
} as const;

const LOADING_CONTAINER_STYLES = {
    minWidth: "100vw",
    minHeight: "100vh",
} as const;

const LAYOUT_STYLES = {
    minWidth: "100vw",
    minHeight: "100vh",
} as const;

const LOGO_STYLES = {
    width: 150,
    marginRight: "20px",
} as const;

const USERNAME_TEXT_STYLES = {
    color: "white",
    width: "500px",
    textAlign: "end" as const,
    marginRight: "20px",
};

const CONTENT_STYLES = {
    padding: "24px",
} as const;

/**
 * Componente principal de la aplicación que maneja la autenticación,
 * navegación y rutas protegidas con permisos basados en roles.
 */
const App: React.FC = memo(() => {
    const [state, setState] = useState<AppState>({
        usuario: null,
        cargandoUsuario: true,
    });

    const { usuario, cargandoUsuario } = state;

    /**
     * Normaliza los permisos del usuario asignando valores por defecto
     * si no están definidos.
     */
    const normalizarPermisos = useCallback((usuarioData: IUsuario): IUsuario => {
        if (!usuarioData.permisos) {
            return { ...usuarioData, permisos: { ...PERMISOS_POR_DEFECTO } };
        }
        return usuarioData;
    }, []);

    /**
     * Carga la información del usuario actual desde la API
     */
    const cargarUsuarioActual = useCallback(async (): Promise<void> => {
        setState((prev) => ({ ...prev, cargandoUsuario: true }));

        try {
            const respuesta = await api.get("/api/usuario_actual/");
            const usuarioData = respuesta.data;

            if (usuarioData?.username) {
                const usuarioNormalizado = normalizarPermisos(usuarioData);
                setState({ usuario: usuarioNormalizado, cargandoUsuario: false });
            } else {
                setState({ usuario: null, cargandoUsuario: false });
            }
        } catch (error) {
            console.error("Error al cargar usuario actual:", error);
            setState({ usuario: null, cargandoUsuario: false });
        }
    }, [normalizarPermisos]);

    /**
     * Maneja el proceso de inicio de sesión actualizando el estado del usuario
     */
    const handleLogin = useCallback(
        (nuevoUsuario: IUsuario | null): void => {
            if (nuevoUsuario?.username) {
                const usuarioNormalizado = normalizarPermisos(nuevoUsuario);
                setState({ usuario: usuarioNormalizado, cargandoUsuario: false });
            } else {
                setState({ usuario: null, cargandoUsuario: false });
            }
        },
        [normalizarPermisos]
    );

    /**
     * Maneja el cierre de sesión limpiando el estado del usuario
     */
    const handleCerrarSesion = useCallback((): void => {
        setState({ usuario: null, cargandoUsuario: false });
    }, []);

    /**
     * Verifica si el usuario tiene un permiso específico diferente de "NO"
     */
    const tienePermiso = useCallback(
        (permiso: keyof IUsuario["permisos"]): boolean => {
            return usuario?.permisos?.[permiso] !== "NO";
        },
        [usuario]
    );

    /**
     * Obtiene el tipo de permiso para un permiso específico
     */
    const obtenerTipoPermiso = useCallback(
        (permiso: keyof IUsuario["permisos"]): TipoPermiso => {
            return usuario?.permisos?.[permiso] || "NO";
        },
        [usuario]
    );

    // Cargar usuario al montar el componente
    useEffect(() => {
        cargarUsuarioActual();
    }, [cargarUsuarioActual]);

    // Memoizar elementos que no cambian frecuentemente
    const logoElement = useMemo(
        () => <Image src="/logo.svg" preview={false} style={LOGO_STYLES} alt="Logo de la aplicación" />,
        []
    );

    const loadingScreen = useMemo(
        () => (
            <Flex justify="center" align="center" style={LOADING_CONTAINER_STYLES}>
                <Result icon={<LoadingOutlined />} title="Cargando..." />
            </Flex>
        ),
        []
    );

    const welcomeMessage = useMemo(() => {
        if (!usuario?.username) return null;

        return <Text style={USERNAME_TEXT_STYLES}>{`Bienvenido, ${usuario.username}`}</Text>;
    }, [usuario?.username]);

    const headerContent = useMemo(() => {
        if (!usuario?.permisos) return null;

        return (
            <>
                <MenuNavegacion permisos={usuario.permisos} />
                {welcomeMessage}
                <BotonCerrarSesion onCerrarSesion={handleCerrarSesion} />
            </>
        );
    }, [usuario?.permisos, welcomeMessage, handleCerrarSesion]);

    // Componentes de rutas memoizados para evitar re-renders innecesarios
    const rutaLogin = useMemo(
        () => (
            <Route
                path="/login"
                element={usuario ? <Navigate to="/" replace /> : <FormularioLogin onLogin={handleLogin} />}
            />
        ),
        [usuario, handleLogin]
    );

    const rutaPrincipal = useMemo(
        () => <Route path="/" element={<PaginaPrincipal usuario={usuario!} onCerrarSesion={handleCerrarSesion} />} />,
        [usuario, handleCerrarSesion]
    );

    const rutaABM = useMemo(
        () => (
            <Route
                path="/abm"
                element={
                    tienePermiso("crud") ? (
                        <ABM tipoPermiso={obtenerTipoPermiso("crud")} />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />
        ),
        [tienePermiso, obtenerTipoPermiso]
    );

    const rutaUsuarios = useMemo(
        () => (
            <Route
                path="/usuarios"
                element={
                    usuario?.permisos ? (
                        <Usuarios usuario={usuario} permiteGestion={usuario.permisos.gestion_usuarios === "SI"} />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />
        ),
        [usuario]
    );

    const rutaReporte = useMemo(
        () => (
            <Route
                path="/grafico"
                element={tienePermiso("generar_reportes") ? <Reporte user={usuario!} /> : <Navigate to="/" replace />}
            />
        ),
        [tienePermiso, usuario]
    );

    const rutaRT = useMemo(
        () => (
            <Route
                path="/rt"
                element={
                    tienePermiso("real_time") ? (
                        <RT tipoPermiso={obtenerTipoPermiso("real_time")} />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />
        ),
        [tienePermiso, obtenerTipoPermiso]
    );

    // Mostrar pantalla de carga mientras se obtiene el usuario
    if (cargandoUsuario) {
        return loadingScreen;
    }

    return (
        <BrowserRouter>
            <Layout style={LAYOUT_STYLES}>
                <Header>
                    <Flex justify="space-between" align="center">
                        <div style={{ flex: 1 }}>{logoElement}</div>
                        {headerContent}
                    </Flex>
                </Header>

                <Content style={CONTENT_STYLES}>
                    <Routes>
                        {rutaLogin}

                        <Route element={<RutaPrivada isAutenticado={!!usuario} />}>
                            {rutaPrincipal}
                            {rutaABM}
                            {rutaUsuarios}
                            {rutaReporte}
                            {rutaRT}
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Content>
            </Layout>
        </BrowserRouter>
    );
});

App.displayName = "App";

export default App;
