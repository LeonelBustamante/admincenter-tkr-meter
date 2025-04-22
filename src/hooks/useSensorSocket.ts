import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface IRespuesta {
  time: string;
  value: number[];
}

const useSensorSocket = (ip?: string, port?: number) => {
  const [datos, setDatos] = useState<IRespuesta>({ time: "", value: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const plcSeleccionadoRef = useRef<{ ip?: string; port?: number }>({
    ip,
    port,
  });

  useEffect(() => {
    // No reconectar si el PLC seleccionado es el mismo
    if (
      plcSeleccionadoRef.current.ip === ip &&
      plcSeleccionadoRef.current.port === port &&
      socketRef.current?.connected
    ) {
      return;
    }

    // Actualizar la referencia
    plcSeleccionadoRef.current = { ip, port };

    // Desconectar socket anterior si existe
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Si no hay IP proporcionada, no conectar
    if (!ip) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Crear nueva conexión
    socketRef.current = io("http://192.168.2.114:5000",{
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Socket conectado");
      // Enviamos la IP y puerto una vez conectados
            socketRef.current?.emit("seleccionar_plc", { ip, port }, (response: any) => {
          if (response?.status === "error") {
            setError(response.message || "Error al seleccionar PLC");
            setLoading(false);
          }
            });
    });

    socketRef.current.on("actualizarDatos", (data) => {
      setDatos(data);
      setLoading(false);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Error de conexión:", err);
      setError("Error de conexión");
      setLoading(false);
    });

    socketRef.current.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        // El servidor forzó la desconexión
        setError("Desconectado por el servidor");
      }
    });

    return () => {
      console.log("Desconectando socket...");
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [ip, port]);

  // Permitir desconexión manual si es necesario
  const disconnect = () => {
    console.log("Desconexión manual del socket");
    socketRef.current?.disconnect();
  };

  // Función para reconectar manualmente si es necesario
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  return { datos, loading, error, disconnect, reconnect };
};

export default useSensorSocket;
