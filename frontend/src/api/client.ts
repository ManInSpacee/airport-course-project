import axios from 'axios'

export const client = axios.create({
  baseURL: '/api',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Ошибка запроса'
    return Promise.reject(new Error(message))
  },
)

export const api = {
  get: <T>(path: string) =>
    client.get<T>(path).then((r) => r.data),

  post: <T>(path: string, body: unknown) =>
    client.post<T>(path, body).then((r) => r.data),

  put: <T>(path: string, body: unknown) =>
    client.put<T>(path, body).then((r) => r.data),

  patch: <T>(path: string, body: unknown) =>
    client.patch<T>(path, body).then((r) => r.data),

  delete: <T>(path: string) =>
    client.delete<T>(path).then((r) => r.data),
}
