# BoolFlix Backend

The REST API for **BoolFlix**, a movie catalog and review application built as a portfolio project. This repository contains the Express backend, which reads and writes movie and review data in MySQL and serves movie images from local storage.

The separate [React frontend](https://github.com/VittorioDauria94/webapp-react) communicates with this API to display the catalog and submit movies and reviews.

## Technologies

The application uses Node.js with ES modules and a MySQL database. The dependency ranges below are declared in `package.json`.

| Dependency | Version range | Role |
| --- | --- | --- |
| Express | `^5.2.1` | HTTP server, routing, JSON body parsing, and static file serving. |
| mysql2 | `^3.16.2` | A single MySQL connection and parameterized SQL queries. |
| Multer | `^2.0.2` | Multipart form parsing and image uploads to disk. |
| Slugify | `^1.6.6` | Lowercase, strict slugs generated from movie titles. |
| Luxon | `^3.7.2` | Formatting database timestamps for API responses. |
| CORS | `^2.8.6` | Configuring the allowed frontend origin. |

## Main features

- Retrieve the movie catalog, including each movie's average review rating.
- Search across movie titles, genres, and directors with one query parameter.
- Retrieve a movie by slug, including its reviews and average rating.
- Create movies with validation of title, director, genre, and abstract.
- Upload one image when creating a movie and serve images through `/img/`.
- Add reviews to a movie using its database ID.
- Return JSON responses for validation failures, missing movies, unmatched routes, and server errors.

## Project structure

```text
webapp-express/
├── app.js                              # Server, CORS, body parsing, and route mounts
├── controllers/
│   ├── movieController.js              # Movie queries, validation, ratings, and creation
│   └── reviewController.js             # Review creation
├── routers/
│   ├── movies.js                       # Movie routes and upload middleware
│   └── reviews.js                      # Review route
├── middlewares/
│   ├── errorHandler.js                 # Central server error response
│   ├── handleImageUpload.js            # Multer disk storage configuration
│   └── routeNotfound.js                # Unmatched-route response
├── database/
│   ├── db.js                           # MySQL connection
│   └── 07_02_2026_ALTER_TABLE_SLUG.sql   # Partial migration for movie slugs
├── public/
│   └── img/                            # Bundled movie images and uploaded files
├── .env.example                        # Environment variable template
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Installation and configuration

### Prerequisites

- Node.js with support for the `--env-file` and `--watch` flags, plus npm. The repository does not pin a Node.js version.
- A running MySQL server and credentials for a compatible database. The connection uses MySQL's default port, `3306`; no custom port is configured.
- A database schema supplied separately: this repository does **not** include a complete initialization script.

### Install dependencies

```sh
git clone https://github.com/VittorioDauria94/webapp-express.git
cd webapp-express
npm install
```

### Configure the environment

Create `.env` from the provided template:

```sh
cp .env.example .env
```

In PowerShell, use `Copy-Item .env.example .env` instead. Replace the example values with your local configuration:

```dotenv
ENVIRONMENT=development
SERVER_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
DB_HOST=127.0.0.1
DB_USER=boolflix_user
DB_PASSWORD=replace_with_your_local_password
DB_DATABASE=movies_db
```

The database user and password are placeholders. The frontend URL is an example origin; use the origin where your React application actually runs. `.env` is excluded from Git.

| Variable | How the application uses it |
| --- | --- |
| `ENVIRONMENT` | When exactly `development`, the error handler includes `err.toString()` in its response. Other values return `SERVER ERROR` instead. |
| `SERVER_URL` | Prefix for image URLs returned by movie endpoints. Use the backend's accessible base URL without a trailing slash. It does not configure the listening address or port. |
| `FRONTEND_URL` | The origin passed to the CORS middleware, including scheme and port. |
| `DB_HOST` | MySQL hostname. |
| `DB_USER` | MySQL account used by the application. |
| `DB_PASSWORD` | Password for that account. |
| `DB_DATABASE` | Existing MySQL database to connect to. |

The server port is fixed at **3000** in `app.js`. Both npm scripts load `.env` through Node.js's `--env-file` flag.

### Prepare the database

Configure a MySQL database and an account with access to it before starting the application. The controllers require the following columns, based on their queries and response formatting:

| Table | Columns referenced by the application |
| --- | --- |
| `movies` | `id`, `slug`, `title`, `director`, `genre`, `release_year`, `abstract`, `image`, `created_at`, `updated_at` |
| `reviews` | `movie_id`, `name`, `vote`, `text`, `created_at`, `updated_at` |

These are code-derived requirements, not a complete schema definition. Obtain a compatible schema or create it separately, including suitable column types, relationships, ID generation, and timestamp defaults. The insert queries omit the movie ID and timestamps; the read controllers expect timestamps that can be formatted as dates.

The only SQL file, [`database/07_02_2026_ALTER_TABLE_SLUG.sql`](database/07_02_2026_ALTER_TABLE_SLUG.sql), performs a partial migration:

- Adds a nullable `VARCHAR(255)` `slug` column and a unique index to `movies_db.movies`.
- Sets slugs for existing movie IDs `1` through `5`.

It does not create the database, create either table, or insert movie or review records. Its database name is hardcoded to `movies_db`, independently of `DB_DATABASE`. Apply it only to a compatible existing schema that does not already have the slug column and index, after checking that the targeted IDs match your records. It is not a repeatable initialization script.

### Run the server

Run commands from the repository root so `.env` and the relative `public/img` path resolve correctly.

Development mode, with automatic restarts:

```sh
npm run dev
```

Normal execution:

```sh
npm start
```

These scripts execute `node --env-file=.env --watch app.js` and `node --env-file=.env app.js`, respectively. The local API is available at `http://localhost:3000`. A MySQL connection failure throws during startup.

## API reference

Examples use `http://localhost:3000` as the base URL. Sample records are illustrative; no database seed is included. JSON responses are described below, with the root greeting and image files noted separately.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Return the greeting `API di film`. |
| `GET` | `/api/movies` | List movies, optionally filtered by `search`. |
| `GET` | `/api/movies/:slug` | Retrieve a movie and its reviews. |
| `POST` | `/api/movies` | Create a movie, optionally uploading one image. |
| `POST` | `/api/reviews/:id` | Create a review for the movie identified by `id`. |
| `GET` | `/img/:filename` | Serve an existing file from `public/img`. |

### GET `/api/movies`

Returns `200 OK` with `{ "count": number, "result": [...] }`. `count` is the number of movies returned; an empty result is `{ "count": 0, "result": [] }`.

| Query parameter | Required | Behavior |
| --- | --- | --- |
| `search` | No | Matches the same value against `title`, `genre`, or `director` using SQL `LIKE '%value%'` and OR conditions. |

For example, `GET /api/movies?search=Nolan` searches all three fields. There are no separate title, genre, or director filter parameters. Matching case sensitivity follows the database collation. Pagination and an explicit sort order are not implemented.

Example response:

```json
{
  "count": 1,
  "result": [
    {
      "id": 1,
      "slug": "inception",
      "title": "Inception",
      "director": "Christopher Nolan",
      "genre": "Science fiction",
      "release_year": 2010,
      "abstract": "A team enters dreams to plant an idea.",
      "image": "http://localhost:3000/img/inception.jpg",
      "created_at": "2/7/2026",
      "updated_at": "2/7/2026",
      "avg_vote": "4.5"
    }
  ]
}
```

Both movie retrieval endpoints select `movies.*`, so any additional database columns are also returned. They replace `image` with `${SERVER_URL}/img/<stored filename>` and format `created_at` and `updated_at` using Luxon's `toLocaleString()`. Date strings depend on the runtime locale; the dates above are examples, not a fixed API date format.

Ratings are calculated with a left join on `reviews.movie_id` and `CAST(AVG(reviews.vote) AS DECIMAL(2,1))`. With the current mysql2 configuration, `avg_vote` is a decimal string such as `"4.5"`, or `null` when there are no non-null votes. Movies without reviews remain in the results. The list endpoint does not include individual reviews.

### GET `/api/movies/:slug`

The required `slug` path parameter identifies the movie, for example `/api/movies/inception`.

Returns `200 OK` with a single movie object containing the same movie fields and `avg_vote` described above, plus a `movieReviews` array. There is no `count` or `result` wrapper. The controller retrieves reviews separately using the movie's database ID.

Each review contains the columns returned by `SELECT * FROM reviews`, including `movie_id`, `name`, `vote`, and `text`. Its `created_at` and `updated_at` values are also formatted with Luxon. A movie with no reviews returns `movieReviews: []` and `avg_vote: null`. Review ordering is not specified.

If the slug does not match a movie, the response is `404 Not Found`:

```json
{
  "error": "NOT FOUND",
  "message": "Film non trovato"
}
```

### POST `/api/movies`

Use `multipart/form-data` to submit text fields and an optional file. The route accepts a single file under the field name `image`. JSON is also accepted for the text fields through the global JSON parser, but cannot carry an image upload.

| Field | Requirement | Handling |
| --- | --- | --- |
| `title` | Required string, 2–150 characters after trimming | Trimmed and used to generate the slug. |
| `director` | Required string, 2–100 characters after trimming | Trimmed before insertion. |
| `genre` | Required string, 2–50 characters after trimming | Trimmed before insertion. |
| `abstract` | Required string, 10–2000 characters after trimming | Trimmed before insertion. |
| `releaseYear` | No application-level validation | Passed directly to the database as `release_year`; acceptance depends on the schema. Supply a suitable year. |
| `image` | Optional file in a multipart request | Stored in `public/img`; the database stores its filename, or `null` if omitted. |

Example using a bundled image, from the repository root (POSIX shell syntax):

```sh
curl -X POST http://localhost:3000/api/movies \
  -F "title=Dream Voyage" \
  -F "director=Alex Morgan" \
  -F "genre=Science fiction" \
  -F "releaseYear=2026" \
  -F "abstract=A crew explores a world shaped by shared dreams." \
  -F "image=@public/img/inception.jpg"
```

The controller generates the slug with `slugify(titleTrimmed, { lower: true, strict: true })`. Multer names an uploaded file `<timestamp>-<original filename>`.

Successful insertion returns `201 Created` with a message only, without a movie object, ID, or slug:

```json
{
  "message": "Movie added correctly"
}
```

Invalid title, director, genre, or abstract values return `422 Unprocessable Entity`, with one entry per failing field. For example, an empty title with otherwise valid fields returns:

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

Database errors pass to the server error handler. For example, with the supplied unique slug index applied, a duplicate slug produces `500`, with no dedicated conflict response or automatic slug suffix.

### POST `/api/reviews/:id`

The required `id` path parameter is the **movie's database ID**, not its slug or a review ID. Send a JSON body with `Content-Type: application/json`:

```json
{
  "name": "Alex",
  "vote": 4,
  "text": "An engaging story with memorable visuals."
}
```

The controller passes `id`, `name`, `vote`, and `text` directly to the insert query. Clients should supply all three body fields, but the application does not validate their presence, types, lengths, or the vote range. It also does not check that the movie exists before inserting; constraints and rejection behavior depend on the database schema.

Successful insertion returns `201 Created`:

```json
{
  "message": "Review added correctly"
}
```

The response does not include the inserted review or its ID. Retrieve the movie by slug to read its reviews; both movie GET endpoints recalculate the average rating from stored reviews on each request. There is no standalone review retrieval route.

### Root, images, and errors

- `GET /` returns `200 OK` with the string `API di film` through `res.send()`. It does not check database health.
- `GET /img/<filename>` serves a file from `public/img`, for example `/img/inception.jpg`. This is a file response, not JSON. The `public` directory is mounted at the server root.
- Unmatched requests, including missing static files, return `404` with `{ "error": "Route not found", "message": "La rotta non esiste" }`.
- Errors passed to `errorHandler` always return `500`, including database errors and upload or JSON parsing errors reaching that middleware. It does not preserve a different status supplied by an upstream error.

Outside `ENVIRONMENT=development`, the server error response is:

```json
{
  "error": "SERVER ERROR",
  "message": "Errore del server."
}
```

In development, the `error` value is replaced with `err.toString()`. Some API messages are currently in Italian; examples preserve the implementation's exact text.

## Frontend integration

The [BoolFlix React frontend](https://github.com/VittorioDauria94/webapp-react) runs separately and sends HTTP requests to this backend. Configure it to use the backend's reachable API address, and set `FRONTEND_URL` here to the frontend's exact origin, such as `http://localhost:5173`, without a path or trailing slash.

CORS is configured globally with `cors({ origin: process.env.FRONTEND_URL })`. The frontend origin controls browser access to responses; it does not provide authentication or authorization. `SERVER_URL` must also be reachable by the frontend because movie responses use it to construct image URLs.

## Project status and limitations

The implemented scope covers catalog retrieval and search, movie details with average ratings and reviews, movie creation, review creation, and local image serving. Relevant limitations are:

- **Database setup:** no complete schema, database creation script, or seed data is included. A fresh clone cannot initialize the database by itself.
- **API scope:** no update or delete endpoints, authentication, authorization, pagination, or configurable sorting are implemented.
- **Validation:** movie text fields are validated, but release years, review fields, movie IDs, and vote ranges are not validated by the application. Slug collisions are delegated to the database.
- **Uploads:** no file-type filter or file-size limit is configured. Uploads occur before controller validation, and failed validation or insertion does not remove uploaded files. When a movie has no image, retrieval currently constructs an `/img/null` URL instead of returning a placeholder.
- **Response contracts:** queries expose all movie and review columns, and dates use locale-dependent formatting. Server errors share a `500` response rather than detailed status mappings.
- **Verification:** no automated test suite or npm test script is included. The project is a portfolio implementation and does not claim production readiness or comprehensive security protections.
