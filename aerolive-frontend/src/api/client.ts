import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error ?? 'Ошибка запроса'
    return Promise.reject(new Error(message))
  },
)

export const api = {
  get:    <T>(url: string)                  => client.get<T>(url).then((r) => r.data),
  post:   <T>(url: string, data: unknown)   => client.post<T>(url, data).then((r) => r.data),
  put:    <T>(url: string, data: unknown)   => client.put<T>(url, data).then((r) => r.data),
  patch:  <T>(url: string, data: unknown)   => client.patch<T>(url, data).then((r) => r.data),
  delete: <T>(url: string)                  => client.delete<T>(url).then((r) => r.data),
}
