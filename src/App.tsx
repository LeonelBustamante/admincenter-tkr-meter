import { Image, Layout, Menu, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { BotonCerrarSesion, FormularioLogin, RutaPrivada } from "./componentes";
import api from "./servicios/api";
import { ABM, PaginaPrincipal } from "./paginas";

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  useEffect(() => {
    api
      .get("/api/usuario_actual/")
      .then((respuesta) => {
        if (respuesta.data.username) {
          setUsuario(respuesta.data.username);
        }
      })
      .catch(() => {
        setUsuario(null);
      })
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
      <Layout style={{ height: "100vh", width: "100vw" }}>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Image
            src="/logo.svg"
            preview={false}
            width={"10%"}
            style={{ flex: 1 }}
          />
          {usuario && (
            <Menu
              theme="dark"
              mode="horizontal"
              style={{ flex: 3, marginLeft: "20px" }}
              items={[
                {
                  key: "inicio",
                  label: <Link to="/">Inicio</Link>,
                },
                {
                  key: "abm",
                  label: <Link to="/abm">Gestión (CRUD)</Link>,
                },
              ]}
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
                    usuario={usuario!}
                    onCerrarSesion={() => setUsuario(null)}
                  />
                }
              />
              <Route path="/abm" element={<ABM />} />
            </Route>
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
