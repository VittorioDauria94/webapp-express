export default function routeNotFound(req, res, next) {
  res.status(404);
  res.json({
    error: "Route not found",
    message: "La rotta non esiste",
  });
}