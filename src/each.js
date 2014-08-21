// ---------------------------------------------------------------------------
var each = function(x,f){
	if (x instanceof Array){
		var vx = x;
		for (var n=0,c=vx.length; n<c; n++){
			f(vx[n],n,vx);
		}
	}
	else{
		var ax = x;
		for(var sKey in ax){
			if (ax.hasOwnProperty(sKey)){
				f(ax[sKey],sKey,ax);
			}
		}
	}
};

module.exports = each;
