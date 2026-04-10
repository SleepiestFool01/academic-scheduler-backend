import db from "../models/index.js";
const Session  = db.session;
const Employee = db.employee;

const authenticate = async (req, res, next) => {
  const authHeader = req.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized! No Auth Header" });
  }

  const token = authHeader.slice(7);

  try {
    const session = (await Session.findAll({ where: { token } }))[0];

    // No session found for this token
    if (!session) {
      return res.status(401).send({ message: "Unauthorized! Session not found" });
    }

    // Session exists but has expired
    if (session.expirationDate < Date.now()) {
      return res.status(401).send({ message: "Unauthorized! Expired token, please log out and log in again" });
    }

    // Attach the authenticated employee to the request so controllers can
    // perform role-based authorization checks (e.g. Admin-only actions).
    // session.id_user maps to employee.id_employee.
    const employee = await Employee.findByPk(session.id_user);
    if (!employee) {
      return res.status(401).send({ message: "Unauthorized! Employee not found" });
    }
    req.user = employee;

    next();
  } catch (err) {
    console.log("Auth error:", err.message);
    return res.status(500).send({ message: "Internal server error during authentication" });
  }
};

export default authenticate;