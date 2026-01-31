import connection from "../database/db.js";

function index(req, res, next) {
  const query = `
  SELECT *
  FROM movies;
  `;

  connection.query(query, (err, results) => {
    if (err) return next(err);

    res.json({
      results,
    });
  });
}

function show(req, res, next) {
  const { id } = req.params;

  const movieQuery = `
    SELECT * 
    FROM movies
    WHERE movies.id = ?;
    `;

  connection.query(movieQuery, [id], (err, results) => {
    if (err) return next(err);

    if (results.length === 0) {
      res.status(404);
      return res.json({
        error: "NOT FOUND",
        message: "Film non trovato",
      });
    }

    const movie = results[0];

    const reviewsQuery = `
      SELECT reviews.* 
      FROM movies
      LEFT JOIN reviews
      ON movies.id = reviews.movie_id
      WHERE movie_id = ?;
    `;

    connection.query(reviewsQuery, [id], (err, results) => {
      if (err) return next(err);

      const respData = {
        ...movie,
        results,
      };

      res.json(respData);
    });
  });
}

export default { index, show };
