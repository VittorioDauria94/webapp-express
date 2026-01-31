import connection from "../database/db.js";

function index(req, res) {
    console.log("index");
}
function show(req, res) {
    console.log("show");
}

export default { index, show };
