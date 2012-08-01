var express = require('express'),
    app     = express(),
    fs      = require('fs'),
    url     = require('url'),
    path    = require('path')
;

app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + "/uploads" }));

app.get('/*', function(req, res) {
    var uri      = url.parse(req.url).pathname,
        filename = path.join(process.cwd(), uri);

    path.exists(filename, function (exists) {
        if (!exists) {
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not Found\n");
            res.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }

        fs.readFile(filename, "binary", function (err, file) {
            if (err) {
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.write(err + "\n");
                res.end();
                return;
            }

            switch (path.extname(filename)) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.html':
                contentType = 'text/html';
                break;
            default:
                contentType = 'text/plain';
            }

            console.log('Transfering with content-type: ', path.extname(filename), contentType);

            res.writeHead(200, {"Content-Type": contentType});
            res.write(file, "binary");
            res.end();
        });
    });
});

app.post('/upload', function(req, res) {
    console.log('Receiving upload');

    var originalFilename = req.files.file.name,
        tmpFile = req.files.file.path;

    fs.readFile(tmpFile, function (err, data) {

      var newPath = __dirname + "/uploads/" + originalFilename;
      fs.writeFile(newPath, data, function (err) {
        if (!err) {
            res.send('Nicely done');
            console.log("  Upload complete")
        }
        else {
            res.send('Something went wrong');
            console.log(err);
        }
        
        fs.unlink(tmpFile);
      });

    });

    
});

app.listen(3000);
console.log('Listening on port 3000');