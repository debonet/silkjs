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
		
		var nIteration = 0;
		var fPrintBody = function(err, jq){
			console.log('---------------------------------------------------- Iteration ' + nIteration );
			nIteration++;
			console.log($("<div></div>").append(jq).html());
		};

		Silk.init(fPrintBody);
	}
);

