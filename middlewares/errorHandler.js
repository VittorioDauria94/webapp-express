export default function errorHandler(err, req, res, next) {
  res.status(500);

  const environment = process.env.ENVIRONMENT;

  return res.json({
    error: environment === "development" ? err.toString() : "SERVER ERROR",
    message: "Errore del server.",
  });
}
