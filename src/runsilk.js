var fCreateDom = require("jsdom").env;
var nsFs = require('fs');
var nsProcess = process;
var GlobalSilk = require("./GlobalSilk");
var Yargs = require("yargs");

// make the Silk object global
global.Silk = GlobalSilk;

var aArg = Yargs
	.usage('[-nostdlib] <silk-file>')
	.demand(1)

	.boolean('n')
	.default('n',false)
	.alias('n', 'nostdlib')
	.describe('n', "No standard library")

	.argv;

var sfl = aArg._[0];
var shtml = nsFs.readFileSync(sfl).toString();

// just in case theres already a body in the script we're running
// swap it out, run the stuff, and print the internal contents only
shtml = shtml.replace("<body","<page");
shtml = shtml.replace("</body","</page");

fCreateDom(
	"<body></body>",
	function(err, window){
		// this needs to be the global.$ because we're simulating
		// the browsers version of window.$
		global.$ = require('jquery')(window);

		$('body').append(Silk.parseHTML(shtml));
		
		var nIteration = 0;
		var timeout;
		var fPrintBody = function(err, jq){
			nIteration++;
			if (timeout){
				clearTimeout(timeout);
			}
			timeout=setTimeout(function(){
				console.log('---------------------------------------------------- Iteration ' + nIteration );
				console.log($("<div></div>").append(jq).html());
			}, 0);

		};

		Silk.init(fPrintBody, aArg['nostdlib']);
	}
);

