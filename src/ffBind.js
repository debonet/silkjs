module.exports = function(o,sf){
	return function(){
		o[sf].apply(o,arguments);
	}
};
