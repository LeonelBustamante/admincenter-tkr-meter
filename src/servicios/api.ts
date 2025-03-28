import axios from "axios";

// Función para obtener el token CSRF de la cookie
const obtenerCSRFToken = (): string | null => {
  const nombre = "csrftoken";
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === nombre) {
      return value;
    }
  }
  return null;
};

const api = axios.create({
  baseURL: "http://localhost:8000", // Ajusta a la URL de tu backend
  withCredentials: true, // Asegura que se envíen las cookies
});

// Interceptor para agregar el token CSRF en cada petición que lo requiera
api.interceptors.request.use((config) => {
  const metodosConToken = ["post", "put", "patch", "delete"];
  if (config.method && metodosConToken.includes(config.method.toLowerCase())) {
    const token = obtenerCSRFToken();
    if (token) {
      config.headers["X-CSRFToken"] = token;
    }
  }
  return config;
});

export default api;
