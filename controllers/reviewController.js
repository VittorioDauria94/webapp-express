import connection from "../database/db.js";

function store(req, res, next) {
  const { id } = req.params;

  const { name, vote, text } = req.body;

  const query = `
  INSERT INTO reviews (movie_id, name, vote, text) 
    VALUES (?, ?, ?, ? );
  `;

  connection.query(query, [id, name, vote, text], (err, results) => {
    if (err) return next(err);
    res.status(201);
    res.json({
      message: "Review added correctly",
    });
  });
}

export default { store };
