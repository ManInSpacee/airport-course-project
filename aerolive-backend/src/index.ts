import app from './app'

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`)
  console.log(`Swagger: http://localhost:${PORT}/docs`)
})
