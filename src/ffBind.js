module.exports = function(o,sf){
	return function(){
		return o[sf].apply(o,arguments);
	}
};
