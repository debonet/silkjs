// ---------------------------------------------------------------------------
var each = require("./each");

module.exports = function(){
	var vxArg = Array.prototype.slice.call(arguments);

	each(vxArg, function(xArg,n){
		if (global.$ && typeof(xArg) === 'object' && xArg instanceof $){
			var jq = xArg;
			var s="jquery [";
			jq.each(function(ne,e){
				s+="\n\t" + ne + " -> " + $("<div />").append($(e).clone()).html();
			});
			s+= "]";
			vxArg[n] = s;
		}
	});

  Function.apply.call(console.log, console, vxArg);
};



