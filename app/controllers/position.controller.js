// controllers/positions.controller.js
import db from "../models/index.js"; // adjust to your setup
const { Position, Department } = db;

export async function listPositions(req, res) {
  try {
    const { id_department } = req.query;

    const where = {};
    if (id_department !== undefined) {
      const dept = Number(id_department);
      if (!Number.isInteger(dept)) {
        return res.status(400).json({ error: "id_department must be an integer." });
      }
      where.id_department = dept;
    }

    const positions = await Position.findAll({
      where,
      order: [["name", "ASC"]],
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id_department", "name"],
        },
      ],
    });

    res.json(positions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch positions." });
  }
}

export async function getPosition(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id." });

    const position = await Position.findByPk(id, {
      include: [{ model: Department, as: "department", attributes: ["id_department", "name"] }],
    });

    if (!position) return res.status(404).json({ error: "Position not found." });
    res.json(position);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch position." });
  }
}

export async function createPosition(req, res) {
  try {
    const { name, avgPayRate, id_department } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required (string)." });
    }

    const pay = Number(avgPayRate);
    if (!Number.isFinite(pay) || pay < 0) {
      return res.status(400).json({ error: "avgPayRate must be a non-negative number." });
    }

    const dept = Number(id_department);
    if (!Number.isInteger(dept)) {
      return res.status(400).json({ error: "id_department must be an integer." });
    }

    // Optional: enforce that department exists (nice error message)
    const deptExists = await Department.findByPk(dept);
    if (!deptExists) {
      return res.status(400).json({ error: `Department ${dept} does not exist.` });
    }

    const created = await Position.create({
      name: name.trim(),
      avgPayRate: pay,
      id_department: dept,
    });

    // return with department included
    const hydrated = await Position.findByPk(created.id_position, {
      include: [{ model: Department, as: "department", attributes: ["id_department", "name"] }],
    });

    res.status(201).json(hydrated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create position." });
  }
}

export async function updatePosition(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id." });

    const { name, avgPayRate, id_department } = req.body;

    const position = await Position.findByPk(id);
    if (!position) return res.status(404).json({ error: "Position not found." });

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "name must be a non-empty string." });
      }
      position.name = name.trim();
    }

    if (avgPayRate !== undefined) {
      const pay = Number(avgPayRate);
      if (!Number.isFinite(pay) || pay < 0) {
        return res.status(400).json({ error: "avgPayRate must be a non-negative number." });
      }
      position.avgPayRate = pay;
    }

    if (id_department !== undefined) {
      const dept = Number(id_department);
      if (!Number.isInteger(dept)) {
        return res.status(400).json({ error: "id_department must be an integer." });
      }

      const deptExists = await Department.findByPk(dept);
      if (!deptExists) {
        return res.status(400).json({ error: `Department ${dept} does not exist.` });
      }

      position.id_department = dept;
    }

    await position.save();

    const hydrated = await Position.findByPk(id, {
      include: [{ model: Department, as: "department", attributes: ["id_department", "name"] }],
    });

    res.json(hydrated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update position." });
  }
}

export async function deletePosition(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id." });

    const deleted = await Position.destroy({ where: { id_position: id } });
    if (!deleted) return res.status(404).json({ error: "Position not found." });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete position." });
  }
}
