const mongoose = require("mongoose");
const dotenv = require("dotenv");

// catching and console logging uncaught exception
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message, err.stack);
  console.log("UNCAUGHT REJECTION shutting down 💥💥💥");

  process.exit(1); //close the server by exiting.
});

// set the default env for the application
dotenv.config({ path: "./.env" });

// importing app from our index js file
const app = require("./index");

// replace the password with database password variable in the .env file
const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

// connect to the server
mongoose.connect(DB).then(() => {
  console.log("connection successful");
});

// the port we will use to connect to the server
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Port is runnning on ${port}`);
});

// handling errors outside express like mongodb server down, wrong mongodb password etc
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION shutting down 💥💥💥");
  server.close(() => {
    process.exit(1); //close the server by exiting.
  });
});
