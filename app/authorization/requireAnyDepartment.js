import db from "../models/index.js";

// Short-circuits list endpoints with an empty array when the caller is a
// non-Admin employee with zero department memberships. Protects endpoints
// that would otherwise return every row in the table when called without
// an id_department filter (e.g. /employees, /tasks, /shifts).
//
// Must run AFTER the `authenticate` middleware — depends on req.user.
const requireAnyDepartment = async (req, res, next) => {
  const employee = req.user;
  if (!employee) return res.status(401).send({ message: "Unauthorized." });

  // Admins see everything system-wide by design.
  if (employee.role === "Admin") return next();

  // Primary department counts as membership.
  if (employee.id_department != null) return next();

  // Otherwise check the junction tables.
  const [mgr, emp] = await Promise.all([
    db.managerDepartment.findOne({ where: { id_employee: employee.id_employee } }),
    db.employeeDepartment.findOne({ where: { id_employee: employee.id_employee } }),
  ]);
  if (mgr || emp) return next();

  // Zero memberships — new / unaffiliated user. Don't leak cross-dept data.
  return res.send([]);
};

export default requireAnyDepartment;
