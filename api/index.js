const graphql = require('./graphql/server');

module.exports = function(app) {
  graphql(app);
};