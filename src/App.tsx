import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Layout, Spin, Menu, Image } from "antd";
import { api } from "./servicios";
import { BotonCerrarSesion, FormularioLogin, RutaPrivada } from "./componentes";
import { ABM, Cartilla, PaginaPrincipal, Usuarios } from "./paginas";

const { Header, Content } = Layout;

export interface Usuario {
  username: string;
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
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <Spin size="large" />
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
            <Menu
              theme="dark"
              mode="horizontal"
              style={{ width: "100%" }}
              items={[
                { key: "inicio", label: <Link to="/">Inicio</Link> },
                { key: "abm", label: <Link to="/abm">Gestión (CRUD)</Link> },
                { key: "grafico", label: <Link to="/grafico">Cartilla</Link> },
                {
                  key: "usuarios",
                  label: usuario.is_staff ? (
                    <Link to="/usuarios">Usuarios</Link>
                  ) : null,
                },
              ].filter((item) => item.label !== null)}
            />
          )}
          <BotonCerrarSesion onCerrarSesion={() => setUsuario(null)} />
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
                    usuario={usuario ? usuario!.username : ""}
                    onCerrarSesion={() => setUsuario(null)}
                  />
                }
              />
              <Route path="/abm" element={<ABM />} />
              <Route path="/usuarios" element={<Usuarios usuario={usuario} />} />
              <Route path="/grafico" element={<Cartilla />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
