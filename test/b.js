c = $r.require('c/c');
var hello = function(){
	console.log( 'hello !');
	c.hello();
};
console.log( exports );
exports.test = hello;

