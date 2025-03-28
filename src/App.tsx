import { Image, Layout, Result, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  BotonCerrarSesion,
  FormularioLogin,
  MenuNavegacion,
  RutaPrivada,
} from "./componentes";
import { ABM, Cartilla, PaginaPrincipal, RT, Usuarios } from "./paginas";
import { api } from "./servicios";

const { Header, Content } = Layout;
const { Text } = Typography;

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  is_staff: boolean;
}

const App: React.FC = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  useEffect(() => {
    api
      .get("/api/usuario_actual/")
      .then((respuesta) => {
        if (respuesta.data.username) {
          setUsuario(respuesta.data);
        }
      })
      .catch(() => setUsuario(null))
      .finally(() => setCargandoUsuario(false));
  }, []);

  if (cargandoUsuario) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
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
            <Image
              src="/logo.svg"
              preview={false}
              style={{ width: 150, marginRight: "20px" }}
            />
          </div>
          {usuario && (
            <>
              <MenuNavegacion />
              <Text
                style={{
                  color: "white",
                  width: "500px",
                  textAlign: "end",
                  marginRight: "20px",
                }}
              >
                {usuario.nombre && usuario.apellido
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
              element={
                usuario ? (
                  <Navigate to="/" />
                ) : (
                  <FormularioLogin onLogin={setUsuario} />
                )
              }
            />
            <Route element={<RutaPrivada isAutenticado={!!usuario} />}>
              <Route
                path="/"
                element={
                  <PaginaPrincipal
                    usuario={usuario!}
                    onCerrarSesion={() => setUsuario(null)}
                  />
                }
              />
              <Route
                path="/abm"
                element={<ABM isStaff={usuario?.is_staff} />}
              />
              <Route
                path="/usuarios"
                element={<Usuarios usuario={usuario} />}
              />
              <Route path="/grafico" element={<Cartilla />} />
              <Route path="/rt" element={<RT />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
