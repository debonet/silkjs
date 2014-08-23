var fCreateDom = require("jsdom").env;
var nsFs = require('fs');
var nsProcess = process;
var GlobalSilk = require("./GlobalSilk");

// make the Silk object global
global.Silk = GlobalSilk;

var sfl = nsProcess.argv[2] || "../examples/test-repeat.silk";
var shtml = nsFs.readFileSync(sfl).toString();

// just in case theres already a body in the script we're running
// swap it out, run the stuff, and print the internal contents only
shtml = shtml.replace("<body","<__page__");
shtml = shtml.replace("</body","</__page__");

fCreateDom(
	"<body></body>",
	function(err, window){
		// this needs to be the global.$ because we're simulating
		// the browsers version of window.$
		global.$ = require('jquery')(window);

		$('body').append(Silk.parseHTML(shtml));

		
		var fPrintBody = function(nIteration){
			console.log('---------------------------------------------------- Iteration ' + nIteration );
			console.log($('__page__,body').last().html());
		};


		var ffMaxFreq = function(f,dtm){
			var timeout;
			var nIteration = 0;
			return function(){
				if (timeout){
					nIteration++;
					clearTimeout(timeout);
					timeout=null;
				}
				timeout = setTimeout(function(){
					timeout=null;
					f(nIteration);
				},dtm);
			}
		};


		Silk.init(ffMaxFreq(fPrintBody,100));
	}
);

