var nsHttp = require('http');
var nsFs = require('fs');
var nsMime = require('mime');

var nsChildProcess = require("child_process");

nsHttp.createServer(function (req, res) {

	if (req["url"] === '/' || req["url"] === '/index.html'){
		return nsChildProcess.exec('make', function(err){
			res.writeHead(200, {'Content-Type': 'text/html'});
			var shtml = nsFs.readFileSync('web/index.html');
			res.end(shtml);
		});
	}

	try{
		var shtml = nsFs.readFileSync("web" + req["url"]);
		res.writeHead(200, {'Content-Type': nsMime.lookup(req["url"])});
		res.end(shtml);
	}
	catch(e){
		res.writeHead(404);
		res.end();
	}

}).listen(5000);

