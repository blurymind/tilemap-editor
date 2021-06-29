const fs = require('fs');

fs.readFile("./sw.js", 'utf8', function (err,data) {
    if (err) return console.log(err);
    const result = data.replace(/const cacheName = ".*";/,
        `const cacheName = "${Date.now()}";`);
    fs.writeFile("./sw.js", result, 'utf8', (err) => {
        if (err) return console.log(err);
    });
});
