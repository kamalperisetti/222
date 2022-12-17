const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

databasePath = path.join(__dirname, "userData.db");
let app = express();
app.use(express.json());

database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  if (`${password.length}` < 5) {
    response.status = 400;
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;

    const dbUser = await database.get(selectUserQuery);

    if (dbUser === undefined) {
      const createUserQuery = `
      INSERT INTO
        user (username, name, password, gender, location)
      VALUES
        ( '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}');`;
      const dbReaponse = await database.run(createUserQuery);
      const newUserId = dbReaponse.lastId;
      response.status = 200;
      response.send("User created successfully");
    } else {
      response.status = 400;
      response.send("User already exists");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  //const hasshedPassword = await bcrypt.hash(request.body.oldPassword);
  const hashedPassword = await bcrypt.hash(request.body.newPassword, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await database.get(selectUserQuery);
  if (`${newPassword.length}` < 5) {
    response.status = 400;
    response.send("Password is too short");
  } else {
    const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatch !== true) {
      response.status = 400;
      response.send("Invalid current password");
    } else {
      response.status = 200;
      response.send("Password updated");
    }
  }
});

module.exports = app;
