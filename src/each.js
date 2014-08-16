// ---------------------------------------------------------------------------
var each = function(a,f){
	for(var sKey in a){
		if (a.hasOwnProperty(sKey)){
			f(a[sKey],sKey,a);
		}
	}
};

module.exports = each;
