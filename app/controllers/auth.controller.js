import db from "../models/index.js";
import authconfig from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

// Your model is db.employee (not db.user — there is no db.user in this project)
const Employee = db.employee;
const Session  = db.session;
const Op       = db.Sequelize.Op;

let googleUser = {};
const google_id = process.env.CLIENT_ID;

const exports = {};

exports.login = async (req, res) => {
  const googleToken = req.body.credential;

  // Verify the Google ID token
  const client = new OAuth2Client(google_id);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    googleUser = ticket.getPayload();
    console.log("Google payload:", JSON.stringify(googleUser));
  }
  await verify().catch(console.error);

  let email     = googleUser.email;
  let firstName = googleUser.given_name;
  let lastName  = googleUser.family_name;

  // Fallback for cases where payload is missing name/email (testing only)
  if (
    (email === undefined || firstName === undefined || lastName === undefined) &&
    req.body.accessToken !== undefined
  ) {
    const oauth2Client = new OAuth2Client(google_id);
    oauth2Client.setCredentials({ access_token: req.body.accessToken });
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();
    email     = data.email;
    firstName = data.given_name;
    lastName  = data.family_name;
  }

  // ── Find or create the employee record ──────────────────────────────────────
  let employee = {};

  await Employee.findOne({ where: { email } })
    .then((data) => {
      if (data != null) {
        employee = data.dataValues;
      } else {
        // New user — will be created below
        employee = { fName: firstName, lName: lastName, email };
      }
    })
    .catch((err) => {
      return res.status(500).send({ message: err.message });
    });

  let isNewUser = false;

  if (employee.id_employee === undefined) {
    // Create new employee record
    isNewUser = true;
    await Employee.create(employee)
      .then((data) => { employee = data.dataValues; })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  } else {
    // Update name to stay in sync with Google
    employee.fName = firstName;
    employee.lName = lastName;
    await Employee.update(
      { fName: firstName, lName: lastName },
      { where: { id_employee: employee.id_employee } }
    ).catch((err) => {
      console.log("Error updating employee name:", err);
    });
  }

  // ── Find or create a session ─────────────────────────────────────────────────
  let session = {};
  let responseSent = false;

  await Session.findOne({
    where: { email, token: { [Op.ne]: "" } },
  })
    .then(async (data) => {
      if (data !== null) {
        session = data.dataValues;

        if (session.expirationDate < Date.now()) {
          // Expired — clear the token and fall through to create a new session
          await Session.update(
            { token: "" },
            { where: { id_session: session.id_session } }
          );
          session = {};
        } else {
          // Valid existing session — respond and mark as done
          const userInfo = {
            email:         employee.email,
            fName:         employee.fName,
            lName:         employee.lName,
            id_employee:   employee.id_employee,
            token:         session.token,
            role:          employee.role,
            picture:       googleUser?.picture,
            isNewUser:     false,
            id_department: employee.id_department,
          };
          console.log("Reusing existing session:", userInfo);
          res.send(userInfo);
          responseSent = true;
        }
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
      responseSent = true;
    });

  if (responseSent) return;

  // ── Create a new session ─────────────────────────────────────────────────────
  if (session.id_session === undefined) {
    const token = jwt.sign({ id: email }, authconfig.secret, { expiresIn: 86400 });
    const tempExpirationDate = new Date();
    tempExpirationDate.setDate(tempExpirationDate.getDate() + 1);

    const newSession = {
      token,
      email,
      id_user:        employee.id_employee, // session.id_user maps to the employee's PK
      expirationDate: tempExpirationDate,
    };

    console.log("Creating new session:", newSession);

    await Session.create(newSession)
      .then(() => {
        const userInfo = {
          email:         employee.email,
          fName:         employee.fName,
          lName:         employee.lName,
          id_employee:   employee.id_employee,
          token,
          role:          employee.role,
          picture:       googleUser?.picture,
          isNewUser,
          id_department: employee.id_department,
        };
        console.log("Login successful:", userInfo);
        return res.send(userInfo);
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  }
};

exports.authorize = async (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "postmessage"
  );

  const { tokens } = await oauth2Client.getToken(req.body.code);
  oauth2Client.setCredentials(tokens);

  let employee = {};

  await Employee.findOne({ where: { id_employee: req.params.id_user } })
    .then((data) => { if (data != null) employee = data.dataValues; })
    .catch((err) => { return res.status(500).send({ message: err.message }); });

  const tempExpirationDate = new Date();
  tempExpirationDate.setDate(tempExpirationDate.getDate() + 100);

  await Employee.update(
    { refresh_token: tokens.refresh_token, expiration_date: tempExpirationDate },
    { where: { id_employee: employee.id_employee } }
  )
    .then(() => {
      res.send({
        refresh_token:   tokens.refresh_token,
        expiration_date: tempExpirationDate,
      });
    })
    .catch((err) => { return res.status(500).send({ message: err.message }); });
};

exports.logout = async (req, res) => {
  if (!req.body || !req.body.token) {
    return res.send({ message: "User has already been successfully logged out!" });
  }

  let session = {};

  await Session.findAll({ where: { token: req.body.token } })
    .then((data) => {
      if (data[0] !== undefined) session = data[0].dataValues;
    })
    .catch((err) => {
      return res.status(500).send({ message: err.message });
    });

  if (session.id_session !== undefined) {
    await Session.update(
      { token: "" },
      { where: { id_session: session.id_session } }
    )
      .then(() => res.send({ message: "User has been successfully logged out!" }))
      .catch((err) => res.status(500).send({ message: err.message }));
  } else {
    res.send({ message: "User has already been successfully logged out!" });
  }
};

export default exports;