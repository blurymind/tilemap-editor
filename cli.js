#!/usr/bin/env node

const handler = require('serve-handler');
const http = require('http');

const { PORT = 3000 } = process.env

// change to file directory
process.chdir(__dirname)

const server = http.createServer((request, response) =>  handler(request, response))
server.listen(PORT, () => {
  console.log(`🚀 Running at http://localhost:${PORT}`)
})