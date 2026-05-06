import axios from "axios";
import { getToken } from "./auth.js";

// const BASE =  "http://localhost:5000/api" || "https://sasquatch-rickety-imaging.ngrok-free.dev/api";

const BASE = "http://localhost:5000/api";
axios.defaults.baseURL = BASE;
axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  (config) => {
    try {
      const token = getToken();
      if (token) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (err) => Promise.reject(err),
);

export default axios;
