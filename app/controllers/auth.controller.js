import db  from "../models/index.js";
import authconfig  from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import  { google } from "googleapis";
import jwt from "jsonwebtoken";

const Employee = db.employee;
const Session = db.session;
const Op = db.Sequelize.Op;

let googleUser = {};

const google_id = process.env.CLIENT_ID;

const exports = {};

exports.login = async (req, res) => {
 

  var googleToken = req.body.credential;

 
  const client = new OAuth2Client(google_id);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    googleUser = ticket.getPayload();
    console.log("Google payload is " + JSON.stringify(googleUser));
  }
  await verify().catch(console.error);

  let email = googleUser.email;
  let firstName = googleUser.given_name;
  let lastName = googleUser.family_name;

  // if we don't have their email or name, we need to make another request
  // this is solely for testing purposes
  if (
    (email === undefined ||
      firstName === undefined ||
      lastName === undefined) &&
    req.body.accessToken !== undefined
  ) {
    let oauth2Client = new OAuth2Client(google_id); // create new auth client
    oauth2Client.setCredentials({ access_token: req.body.accessToken }); // use the new auth client with the access_token
    let oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    let { data } = await oauth2.userinfo.get(); // get employee info
    console.log(data);
    email = data.email;
    firstName = data.given_name;
    lastName = data.family_name;
  }


  let employee = {};
  let session = {};

  await Employee.findOne({
    where: {
      email: email,
    },
  })
    .then((data) => {
      if (data != null) {
        employee = data.dataValues;
      } else {
        // create a new Employee and save to database
        employee = {
          fName: firstName,
          lName: lastName,
          email: email,
        };
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });

  // this lets us get the employee id
  if (employee.id_employee === undefined) {
  
    await Employee.create(employee)
      .then((data) => {
        employee = data.dataValues;
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
        return;
      });
  } else {
    
    // doing this to ensure that the employee's name is the one listed with Google
    employee.fName = firstName;
    employee.lName = lastName;
  
    await Employee.update(employee, { where: { id_employee: employee.id_employee } })
      .then((num) => {
        if (num == 1) {
          console.log("updated employee's name");
        } else {
          console.log(
            `Cannot update Employee with id_employee=${employee.id_employee}. Maybe Employee was not found or req.body is empty!`
          );
        }
      })
      .catch((err) => {
        console.log("Error updating Employee with id=" + employee.id_employee + " " + err);
      });
  }

  // try to find session first

  await Session.findOne({
    where: {
      email: email,
      token: { [Op.ne]: "" },
    },
  })
    .then(async (data) => {
      if (data !== null) {
        session = data.dataValues;
        if (session.expirationDate < Date.now()) {
          session.token = "";
          // clear session's token if it's expired
          await Session.update(session, { where: { id_session: session.id_session } })
            .then((num) => {
              if (num == 1) {
                console.log("successfully logged out");
              } else {
                console.log("failed");
                res.send({
                  message: `Error logging out employee.`,
                });
              }
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send({
                message: "Error logging out employee.",
              });
            });
          //reset session to be null since we need to make another one
          session = {};
        } else {
          // if the session is still valid, then send info to the front end
          let employeeInfo = {
            email: employee.email,
            fName: employee.fName,
            lName: employee.lName,
            id_employee: employee.id_employee,
            token: session.token,
            role: employee.role, //added so I can checl the role in the freindly login & check if a employee is a admin, Coach, or a Player
            picture: googleUser?.picture,
            // refresh_token: employee.refresh_token,
            // expiration_date: employee.expiration_date
          };
          console.log("found a session, don't need to make another one");
          console.log(employeeInfo);
          res.send(employeeInfo);
        }
      }
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions.",
      });
    });

  if (session.id_session === undefined) {
    // create a new Session with an expiration date and save to database
    let token = jwt.sign({ id: email }, authconfig.secret, {
      expiresIn: 86400,
    });
    let tempExpirationDate = new Date();
    tempExpirationDate.setDate(tempExpirationDate.getDate() + 1);
    const session = {
      token: token,
      email: email,
      id_employee: employee.id_employee,
      expirationDate: tempExpirationDate,
    };

    console.log("making a new session");
    console.log(session);

    await Session.create(session)
      .then(() => {
        let employeeInfo = {
          email: employee.email,
          fName: employee.fName,
          lName: employee.lName,
          id_employee: employee.id_employee,
          token: token,
          role: employee.role,
          picture: googleUser?.picture,
          // refresh_token: employee.refresh_token,
          // expiration_date: employee.expiration_date
        };
        console.log(employeeInfo);
        res.send(employeeInfo);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  }
};

exports.authorize = async (req, res) => {
  console.log("authorize client");
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "postmessage"
  );

  console.log("authorize token");
  // Get access and refresh tokens (if access_type is offline)
  let { tokens } = await oauth2Client.getToken(req.body.code);
  oauth2Client.setCredentials(tokens);

  let employee = {};
  console.log("findUser");

  await Employee.findOne({
    where: {
      id_employee: req.params.id_employee,
    },
  })
    .then((data) => {
      if (data != null) {
        employee = data.dataValues;
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
      return;
    });
  console.log("employee");
  console.log(employee);
  employee.refresh_token = tokens.refresh_token;
  let tempExpirationDate = new Date();
  tempExpirationDate.setDate(tempExpirationDate.getDate() + 100);
  employee.expiration_date = tempExpirationDate;

  await Employee.update(employee, { where: { id_employee: employee.id_employee } })
    .then((num) => {
      if (num == 1) {
        console.log("updated employee's google token stuff");
      } else {
        console.log(
          `Cannot update Employee with id=${employee.id_employee}. Maybe Employee was not found or req.body is empty!`
        );
      }
      let employeeInfo = {
        refresh_token: employee.refresh_token,
        expiration_date: employee.expiration_date,
      };
      console.log(employeeInfo);
      res.send(employeeInfo);
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });

  console.log(tokens);
  console.log(oauth2Client);
};

exports.logout = async (req, res) => {
  console.log(req.body);
  if (req.body === null) {
    res.send({
      message: "Employee has already been successfully logged out!",
    });
    return;
  }

  // invalidate session -- delete token out of session table
  let session = {};

  await Session.findAll({ where: { token: req.body.token } })
    .then((data) => {
      if (data[0] !== undefined) session = data[0].dataValues;
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions.",
      });
      return;
    });

  session.token = "";

  // session won't be null but the id will if no session was found
  if (session.id_session !== undefined) {
    Session.update(session, { where: { id_session: session.id_session } })
      .then((num) => {
        if (num == 1) {
          console.log("successfully logged out");
          res.send({
            message: "Employee has been successfully logged out!",
          });
        } else {
          console.log("failed");
          res.send({
            message: `Error logging out employee.`,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({
          message: "Error logging out employee.",
        });
      });
  } else {
    console.log("already logged out");
    res.send({
      message: "Employee has already been successfully logged out!",
    });
  }
};
export default exports;