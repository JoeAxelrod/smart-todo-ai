import axios from "axios";
export const API = "http://localhost:4000";

export const api = axios.create({ baseURL: API });

// set initial header (page reload)
const saved = localStorage.getItem("token");
if (saved) api.defaults.headers.common.Authorization = "Bearer " + saved;

export function setToken(token: string) {
  localStorage.setItem("token", token);

  // update BOTH axios globals *and* this instance
  axios.defaults.headers.common.Authorization = "Bearer " + token;
  api.defaults.headers.common.Authorization   = "Bearer " + token;
}
