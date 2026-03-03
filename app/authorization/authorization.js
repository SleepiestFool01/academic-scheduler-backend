import db from "../models/index.js";
const Session = db.session;

const authenticate = (req, res, next) => {
  const authHeader = req.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized! No Auth Header" });
  }

  const token = authHeader.slice(7);

  Session.findAll({ where: { token } })
    .then((data) => {
      const session = data[0];

      // No session found for this token
      if (!session) {
        return res.status(401).send({ message: "Unauthorized! Session not found" });
      }

      // Session exists but has expired
      if (session.expirationDate < Date.now()) {
        return res.status(401).send({ message: "Unauthorized! Expired token, please log out and log in again" });
      }

      // Valid session — allow request through
      next();
    })
    .catch((err) => {
      console.log("Auth error:", err.message);
      return res.status(500).send({ message: "Internal server error during authentication" });
    });
};

export default authenticate;