var d = $r.require('d');
var hello = function(){
	console.log( 'hello from module b');
};

exports.hello = hello;
exports.other_hello = d.hello;

