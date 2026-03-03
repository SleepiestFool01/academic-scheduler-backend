import routes from "./app/routes/index.js";
import express from "express";
import cors from "cors";
import db from "./app/models/index.js";

// Add new columns without manual migrations
db.sequelize.sync({ alter: true });

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