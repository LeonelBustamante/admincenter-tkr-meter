import "@ant-design/v5-patch-for-react-19";
import { ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          colorPrimary: "#ff0000",
          colorInfo: "#ff0000",
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
);
