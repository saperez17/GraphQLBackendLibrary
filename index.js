const {
  ApolloServer,
  UserInputError,
  AuthenticationError,
  gql,
} = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const http = require("http");
const express = require("express");
const config = require("./utils/config");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { v1: uuid } = require("uuid");
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const startup = require("./lib/startup");
const api = require('./api/index');

const MONGODB_URI = config.MONGODB_URI;
const JWT_SECRET = "NEED_HERE_A_SECRET_KEY";

console.log("connecting to", MONGODB_URI);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB:", error.message);
  });


/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's name in the context of the book instead of the author's id
 * However, for simplicity, we will store the author's name in connection with the book
 */

startup()
  .then(() => {
    const app = express();
    const port = process.env.PORT || 5001;

    // middleware(app);
    api(app);

    process.on("message", (message) => {
      console.log(message);
    });
  })
  .catch((error) => {
    console.log(error);
  });
