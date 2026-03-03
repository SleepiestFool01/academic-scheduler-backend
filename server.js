import routes from "./app/routes/index.js";
import express from "express";
import cors from "cors";
import db from "./app/models/index.js";

// Pre-sync migration: make tasks.id_tasklist nullable so Sequelize can add the
// ON DELETE SET NULL FK constraint (MySQL rejects SET NULL on a NOT NULL column).
// Silently ignored if the column is already nullable or the table doesn't exist yet.
db.sequelize
  .query("ALTER TABLE `tasks` MODIFY `id_tasklist` INTEGER NULL DEFAULT NULL")
  .catch(() => {})
  .then(() => db.sequelize.sync({ alter: true }))
  .catch((err) => { console.error("Sync failed:", err.message); process.exit(1); });

const app = express();

var corsOptions = {
  origin: "http://localhost:8081",
  credentials: true,
};
app.use(cors(corsOptions));

// Parse requests of content-type - application/json
app.use(express.json());
// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Load routes — mounted at /workerscheduling-t9 to match Apache proxy and services.js baseURL
app.use("/workerscheduling-t9", routes);

// Set port, listen for requests
const PORT = process.env.PORT || 3129;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

export default app;