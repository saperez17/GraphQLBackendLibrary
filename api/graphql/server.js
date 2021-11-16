const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const http = require("http");
const schema = require("./schema");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const JWT_SECRET = "NEED_HERE_A_SECRET_KEY";

const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");

module.exports = async function (app) {
  const PORT = process.env.PORT || 5001;
  const httpServer = http.createServer(app);
  // const executableSchema = makeExecutableSchema({ ...schema });
  const executableSchema = makeExecutableSchema({ ...schema });

  const server = new ApolloServer({
    schema: executableSchema,
    context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null;
      if (auth && auth.toLocaleLowerCase().startsWith("bearer ")) {
        const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
        const currentUser = await User.findById(decodedToken.id);
        return { currentUser };
      }
    },
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
  });

  await server.start();

  server.applyMiddleware({
    app,
    path: "/api/graphql",
  });

  const subscriptionServer = SubscriptionServer.create(
    {
      // This is the `schema` we just created.
      schema: executableSchema,
      // These are imported from `graphql`.
      execute,
      subscribe,
    },
    {
      // This is the `httpServer` we created in a previous step.
      server: httpServer,
      // This `server` is the instance returned from `new ApolloServer`.
      path: server.graphqlPath,
    }
  );

  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`
    );

    console.log(
      `🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`
    );
  });

};
