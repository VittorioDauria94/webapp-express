import slugify from "slugify";
import connection from "../database/db.js";
import { DateTime } from "luxon";

function index(req, res, next) {
  const { search } = req.query;

  let params = [];
  let query = `
  SELECT movies.*, CAST(AVG(reviews.vote) AS DECIMAL(2,1)) AS avg_vote
  FROM movies
  LEFT JOIN reviews
  ON movies.id = reviews.movie_id
  `;

  if (search) {
    query += `
    WHERE movies.title LIKE ? 
    OR movies.genre LIKE ? 
    OR movies.director LIKE ?`;

    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += `
  GROUP BY movies.id;
  `;

  connection.query(query, params, (err, results) => {
    if (err) return next(err);

    const movies = results.map((movie) => {
      return {
        ...movie,
        image: `${process.env.SERVER_URL}/img/${movie.image}`,
        updated_at: DateTime.fromJSDate(movie.updated_at).toLocaleString(),
        created_at: DateTime.fromJSDate(movie.created_at).toLocaleString(),
      };
    });

    res.json({
      count: movies.length,
      result: movies,
    });
  });
}

function show(req, res, next) {
  const { slug } = req.params;

  const movieQuery = `
    SELECT movies.*, CAST(AVG(reviews.vote) AS DECIMAL(2,1)) AS avg_vote
    FROM movies
    LEFT JOIN reviews
    ON movies.id = reviews.movie_id
    WHERE movies.slug = ?
    GROUP BY movies.id;
    `;

  connection.query(movieQuery, [slug], (err, results) => {
    if (err) return next(err);

    if (results.length === 0) {
      res.status(404);
      return res.json({
        error: "NOT FOUND",
        message: "Film non trovato",
      });
    }

    const movies = results.map((movie) => {
      return {
        ...movie,
        image: `${process.env.SERVER_URL}/img/${movie.image}`,
        created_at: DateTime.fromJSDate(movie.created_at).toLocaleString(),
        updated_at: DateTime.fromJSDate(movie.updated_at).toLocaleString(),
      };
    });

    const movie = movies[0];

    const reviewsQuery = `
    SELECT *
    FROM reviews
    WHERE movie_id = ?;
    `;

    connection.query(reviewsQuery, [movie.id], (err, resultReviews) => {
      if (err) return next(err);

      const movieReviews = resultReviews.map((review) => {
        return {
          ...review,
          created_at: DateTime.fromJSDate(review.created_at).toLocaleString(),
          updated_at: DateTime.fromJSDate(review.updated_at).toLocaleString(),
        };
      });

      const respData = {
        ...movie,
        movieReviews,
      };

      res.json(respData);
    });
  });
}

function store(req, res, next) {
  const { title, director, genre, releaseYear, abstract} = req.body;

   const imageName = req.file?.filename ?? null;

  const slug = slugify(title, {
    lower: true,
    strict: true,
  });

  const query = `
  INSERT INTO movies (slug, title, director, genre, release_year, abstract, image) 
    VALUES (?, ?, ?, ?, ?, ?, ? );
  `;

  connection.query(
    query,
    [slug, title, director, genre, releaseYear, abstract, imageName],
    (err, results) => {
      if (err) next(err);
      res.status(201);
      res.json({
        message: "Movie added correctly",
      });
    },
  );
}

export default { index, show, store };
