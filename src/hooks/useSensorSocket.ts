import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface IRespuesta {
  time: string;
  value: number[];
}

const socket: Socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

const useSensorSocket = () => {
  const [datos, setDatos] = useState<IRespuesta>({ time: "", value: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Connecting to WebSocket...");

    socket.on(`actualizarDatos`, (data) => {
      console.log("Recibiendo datos...");
      setDatos(data);
      setLoading(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setError("Connection error");
      setLoading(false);
    });

    // Clean up the connection on unmount
    return () => {
      console.log("Desconectando...");
      socket.off(`actualizarDatos`);
      socket.off("connect_error");
    };
  }, []);

  return { datos, loading, error };
};

export default useSensorSocket;
