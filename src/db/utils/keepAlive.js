function keepAlive(connection) {
  setInterval(() => {
    connection.query('SELECT 1');
  }, 5000);
}

module.exports = keepAlive;
