## GraphQL Backend for a small library
This repository was created as part of my ongoing learning path on web development, and particularly is the solution repository for the challenge proposed on course [**Part 8, GraphQL**](https://fullstackopen.com/en/part8/graph_ql_server#exercises-8-1-8-7), of the Fullstack course from the University of Helsinki.

### Technologies summary
1. graphql: Alternative to REST. > A query language for your API
2. Apollo-server: Graphql server library

### Usage
1. Git clone this repo and run ***npm run i***
2. Go to: ***http://localhost:4000***
3. Run some queries. Below are some of the queries I used to test the GraphQL backend. Feel free to modify them as you please.

```graphql
query LibraryQueries{
  authorCount
  bookCount
}

query allBooks{
  allBooks {
    id
    title
    published
    author
    genres
  }
}

query AllAuthors {
  allAuthors {
    name
    born
    bookCount
  }
}

query AllBooksByAuthor {
  allBooks(author: "Robert Martin") {
    title
  }
}

query AllBooksByGenre {
  allBooks(genre: "refactoring") {
    title
    published
  }
}

query AllBooksByAuthorAndGenre {
  allBooks(author: "Robert Martin", genre: "refactoring") {
    title
    published
  }
}

mutation AddBook {
  addBook(
    title: "NoSQL Distilled",
    author: "Martin Fowler",
    published: 2012,
    genres: ["database", "nosql"]
  ) {
    title,
    author
  }
}

mutation AddBookUnknownAuthor {
    addBook(
    title: "Pimeyden tango",
    author: "Reijo Mäki",
    published: 1997,
    genres: ["crime"]
  ) {
    title,
    author
  }
}

mutation editAuthorBirthYear {
  editAuthor(name: "Reijo Mäki", born: 1890) {
    name
    born
    bookCount
  }
}
```