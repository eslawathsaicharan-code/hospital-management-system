import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getWards = () => api.get("/wards").then((r) => r.data);
export const getBeds = () => api.get("/beds").then((r) => r.data);
export const createPatient = (data) => api.post("/patients", data).then((r) => r.data);
export const getQueue = () => api.get("/queue").then((r) => r.data);
export const getActiveAllocations = () => api.get("/allocations/active").then((r) => r.data);
export const allocatePatient = (id) => api.post(`/allocate/${id}`).then((r) => r.data);
export const dischargeAllocation = (id) => api.put(`/discharge/${id}`).then((r) => r.data);
export const getOverflow = (wardType, lat, lon) =>
  api
    .get(`/overflow/${encodeURIComponent(wardType)}`, { params: { my_lat: lat, my_lon: lon } })
    .then((r) => r.data);

// FastAPI returns errors in two shapes: a string, or a list for validation errors
export function getErrorMessage(err) {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => `${d.loc.at(-1)}: ${d.msg}`).join(", ");
  return "Could not reach the server. Is the backend running?";
}
