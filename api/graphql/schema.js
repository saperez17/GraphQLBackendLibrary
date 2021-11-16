const { gql } = require("apollo-server-express");
const Book = require("../../models/book");
const Author = require("../../models/author");
const User = require("../../models/user");
const { PubSub } = require("graphql-subscriptions");

const pubsub = new PubSub();

const schema = {
  typeDefs: gql`
    type Book {
      title: String!
      published: Int!
      author: Author!
      genres: [String!]!
      id: ID!
    }
    type Author {
      name: String!
      id: ID!
      born: Int
      bookCount: Int!
    }
    type User {
      username: String!
      favoriteGenre: String!
      id: ID!
    }
    type Token {
      value: String!
    }

    type Query {
      bookCount: Int!
      authorCount: Int!
      allBooks(author: String, genre: String): [Book!]!
      allAuthors: [Author!]!
      me: User
    }

    type Mutation {
      addBook(
        title: String!
        author: String!
        published: Int!
        genres: [String!]!
      ): Book
      editAuthor(name: String!, born: Int!): Author
      createUser(username: String!, favoriteGenre: String!): User
      login(username: String!, password: String!): Token
    }

    type Subscription {
      bookAdded: Book!
    }
  `,

  resolvers: {
    Query: {
      bookCount: (root, args) => Book.collection.countDocuments(),
      authorCount: (root, args) => Author.collection.countDocuments(),
      allBooks: async (root, args) => {
        if (args.genre) {
          return Book.find({ genres: { $in: [args.genre] } }).populate(
            "author"
          );
        }

        return Book.find({}).populate("author");
      },
      allAuthors: async (root, args) => Author.find({}),
      me: (root, args, context) => context.currentUser,
    },

    Author: {
      bookCount: async (root) => {
        const writtenBooks = await Book.find({ author: { $in: root.id } });
        return writtenBooks.length;
      },
    },

    Mutation: {
      addBook: async (root, args, { currentUser }) => {
        if (!currentUser) {
          return new AuthenticationError("not authenticated");
        }

        const authorSearch = await Author.findOne({ name: args.author });
        if (!authorSearch) {
          const newAuthor = new Author({ name: args.author });
          await newAuthor.save();
          const book = new Book({
            title: args.title,
            published: args.published,
            genres: args.genres,
            author: newAuthor,
          });
          try {
            await book.save();
          } catch (e) {
            throw new UserInputError(error.message, {
              invalidArgs: args,
            });
          }

          return book;
        }
        const book = new Book({
          title: args.title,
          published: args.published,
          genres: args.genres,
          author: authorSearch,
        });

        console.log("before publish");
        pubsub.publish("BOOK_ADDED", {
          bookAdded: book,
        });

        return book.save().catch((error) => {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        });
      },

      editAuthor: async (root, args, context) => {
        const currentUser = context.currentUser;
        if (!currentUser) {
          return new AuthenticationError("not authenticated");
        }
        const authorSearch = await Author.findOne({ name: args.name });
        authorSearch.born = args.born;
        await authorSearch.save();

        return authorSearch;
      },

      createUser: async (root, args) => {
        const { username, favoriteGenre } = args;
        const foundUser = await User.findOne({ username: username });

        if (foundUser) {
          return null;
        }
        const newUser = new User({
          username: username,
          favoriteGenre: favoriteGenre,
        });
        return newUser.save().catch((e) => {
          throw new UserInputError(e.message, {
            invalidArgs: args,
          });
        });
      },

      login: async (root, args) => {
        const user = await User.findOne({ username: args.username });
        if (!user || args.password !== "secret") {
          throw new UserInputError("wrong credentials");
        }

        const userForToken = {
          username: user.username,
          favoriteGenre: user.favoriteGenre,
          id: user._id,
        };

        return { value: jwt.sign(userForToken, JWT_SECRET) };
      },
    },

    Subscription: {
      bookAdded: {
        subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"]),
      },
    },
  },
};

module.exports = schema;
