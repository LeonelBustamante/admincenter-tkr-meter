import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@ant-design/v5-patch-for-react-19";
import App from "./App.tsx";
import { ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider locale={esES}>
      <App />
    </ConfigProvider>
  </StrictMode>
);
