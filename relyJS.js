/**
 * relyJS
 * @version 0.0.20110604
 * @author Neekey <ni184775761@gmail.com>
 * @description a imporved version of importJS
 */

(function() {

/**
 * Base namespace for the framework
 */
this.$r = { _$r: this.$r };

/**
 * private & publick utilities for the framework to use
 * this utilities must be mutual independence
 */
var util = {
	
	/*
	 * AJAX
	 * httpRequest used for load resource ( every string files )
	 * @param {String} url 
	 * @param {Function} [callback] 
	 * @param {Any} [userData] custom data passed to callback
	 */
	httpRequest: function( url, callback, userData ) {
	
		// create XMLHttpRequest object
		var xhr = window.XMLHttpRequest ? 
			new XMLHttpRequest() : new ActiveXObject( 'Microsoft.XMLHTTP' );
			
		// set callcack
		xhr.onreadystatechange = function() {
		
			if ( xhr.readyState == 4 ) {
			
				// Determine the data type
				var t = xhr.getResponseHeader( 'content-type' ), err, data;
				
				if ( xhr.status < 200 ) {
					// 1xx informational response;
					return;
				} 
				else if ( xhr.status >= 300 ) {
					// 3xx Redirection
					// 4xx Client error
					// 5xx Server error
					err = xhr.status;
				}
				// else 2xx successful response;
				else {
					// if XML
					if ( t === 'application/xml' )
						data = xhr.responseXML;
					// if JSON
					else if ( t === 'application/json' )
						data = JSON.parse( xhr.responseText );
					// Other
					else
						data = xhr.responseText;
				}
				
				callback( err, data, xhr, userData );
			}
		};
		xhr.open( 'GET', url, true );
		xhr.send();
	},
	
	/**
	 * image loader
	 * @param {String} url 
	 * @param {Function} [callback] 
	 * @param {Any} [userData] custom data passed to callback
	 */
	imgLoader: function( url, callback, userData ) {
	
		var _imgLoader = arguments.callee,
		// for closure use
		_this = this,
		// create Image object
		imgObj = new Image();
		
		// if it is the first call to this method, set callback
		if( !_imgLoader._onload ) {
		
			_imgLoader._onload = function( e ) {
				_imgLoader._oncomplete( this, 'load' );
			};
			
			_imgLoader._onerror = function( e ) {
				_imgLoader._oncomplete( this, 'error' );
			};
			
			_imgLoader._onabort = function( e ) {
				_imgLoader._oncomplete( this, 'abort' );
			};
			
			_imgLoader._oncomplete = function( img, type ) {
				var err, xhr;
				if ( type == 'error' || type == 'abort' ) {
					err = 'img: ' + url + '[loadError]';
				}
				callback( err, img, xhr, userData );
			};
		}
		// set callback to img
		imgObj.onload = _imgLoader._onload;
		imgObj.onabort = _imgLoader._onabort;
		imgObj.onerror = _imgLoader._onerror;
		imgObj.src = url;
	},
	
	/**
	 * handle url , convert to Absolute url
	 * @private
	 * @param {String} url 
	 * @param {String} [localPath] Reference url
	 * @returns {String} 
	 */
	handleUrl: function( url, localPath ) {
	
		var URL_EX = /^http\:\/\/.+$|^https\:\/\/.+$/,
		spaceEx = /^(\s+)|(\s+)$/g;
		
		// get url... remove alias if exist
		url = ( url || '' )
		.replace( spaceEx, '' )
		.split( /\s+/ )[ 0 ];
		
		// if url is an absolute url 
		if ( URL_EX.test( url ) ) {
			return url;
		}
		else {
			// backup the protocol 'http' part， for rebuilding url
			var httpStr = localPath.substring( 0, localPath.indexOf( "://" ) + 3);
			
			// remove the protocol part and file name part of the url, include‘/’
			localPath = localPath.substring(
				localPath.indexOf("://") + 3, localPath.lastIndexOf("/"));
				
			// Use '/ ' partition of the url
			var localArray = localPath.split("/");
			var urlArray = url.split("/");
       
			while ( urlArray.length > 0 ) {
				// if ".."，pop()  localArray
				if ( urlArray[ 0 ] === ".." ) {
					localArray.pop();
				}
				else{
					localArray.push( urlArray[ 0 ] );
				}
				// remove the first elem of urlArray
				urlArray.splice( 0, 1 );
			}
			
			// rebuild new url
			var urlHandled = httpStr;
			for ( var i = 0; i < localArray.length; i++ ) {
				if( i !== ( localArray.length - 1 ) ) {
					urlHandled += ( localArray[ i ] + "/" );
				}
				else{
					urlHandled += localArray[ i ];
				}
			}
			return urlHandled;
		}
	},
	
	/**
	 * Check whether the specified string in the array
	 * @param {Array} arr whose elems are all string
	 * @param {String} str
	 * @param {Boolean} 
	 */
	inStringArray: function( arr, str ){
		if( arr.constructor == Array && typeof str == 'string' ){
			var arrStr = arr.join( ' @ ' );
			if( arrStr.indexOf( str ) >= 0 ){
				return true;
			}
		}
		return false;
	}
}

/**
 * private member( method & attribute )
 */
var pri = {
	
	/**
	 * configuration for the framework
	 * 	scriptSuffix: ['js']
	 *	dataSuffix: ['json', 'hmtl'],
	 * 	imageSuffix: ['png', 'gif', 'jpg', 'bmp']
	 * 	log: true
	 */
	config: {
		scriptSuffix: ['js'],
		dataSuffix: ['json', 'hmtl'],
		imageSuffix: ['png', 'gif', 'jpg', 'bmp'],
		/* if log info to console */
		log: true
	},
	
	/**
	 * log, record info about loading
	 */
	logList: [],
	
	/**
	 * status of load
	 *	finished
	 *	loading
	 *	initializing
	 */
	status: 'initializing',
	
	/**
	 * Resource collection unit list
	 * every time $r.load is called, an new Resource collection unit will be add to the list
	 * Resource collection unit:
	 *	type: script | data | image
	 *	url: [ 'http://neekey.net/importJS.js', 'http://google.com/b.js' ]	- resource absolute url
	 *	rely: [],	- rely resource absolute url
	 *	status: 'loading'
	 *	alias: 'module',	- the name of this collection, optional
	 *	callback: fn,	
	 *	userData: ,	- custom data pass to callback
	 */
	rcuList: [],
	
	/**
	 * loading list
	 * 	url: status
	 *	type: script | data | image
	 */
	loadingList: {},
	
	/**
	 * finished resource list
	 * 	url: {
	 *		data: resData,
	 *		type: script | image | data
	 *	}
	 */
	finishedList: {},
	
	/**
	 * once a script resource been execued , it will be add to this list 
	 *	url: ifexecued
	 */
	scriptList: {},
	
	/**
	 * A map from resource url to its alias
	 * url: alias
	 */
	aliasList: {},
	
	/**
	 * module list, every call of $r.load corresponds to an module
	 * if 'alias' specified in $r.load, it will be the name of the module, 
	 * else the module name will be automatically generated, such as 'module_1'
	 */
	moduleList: {},

	requireList: {},
	
	/**
	 * used for generate module alias
	 */
	moduleAliasPrefix: 'module_',
	moduleAliasCounter: 0,
	
	/**
	 * add info to the loglist
	 */
	log: function( type, info ){
		this.logList.push( [ type, info ] );
		if( console && console.log && this.config.log ){
			console.log( '[ ' + type + ' ] ' + info );
		}
	},
	
	/**
	 * error handle
	 */
	errorHandle: function( type, msg ){
		this.log( type, msg );
		if( type == 'error' ){
			throw 'Error occurs! ' + msg;
		}
	},
	
	/**
	 * get alias by analysize url
	 */
	getAlias: function( url ){
		var spaceEx = /^(\s+)|(\s+)$/g;
		url = ( url || '' )
		.replace( spaceEx, '' )
		.split( /\s+/ )[ 1 ];
		return url ? url : '';
	},
	
	/**
	 * initialize resource collection unit
	 */
	initRcu: function( o ){
		var i;
		// o.status = 'wait';

		// add rely to url
		o.url = o.rely.concat( o.url );
		
		// push to rcuList
		this.rcuList.push( o );
		
		// add url to loadingList
		this.addLoadingList( o.url );
		
		this.log( 'info', 'a new resource collection unit has been initialized!' );
	},
	
	/**
	 * Traverse loadingList to load resource
	 */
	loadResource: function(){
	
		var i, lolist = this.loadingList,
		_this = this,
		callback = function(){
			_this.loadCallback.apply( _this, arguments );
		};
		
		// Traverse loadingList
		for( i in lolist ){
			if( lolist[ i ].status == 'wait' ){
				if( lolist[ i ].type == 'image' ){
					// load image
					util.imgLoader( i, callback, { url: i, type: lolist[ i ].type } );
					this.log( 'info', 'request image: ' + i );
				}
				else {
					util.httpRequest( i, callback, { url: i, type: lolist[ i ].type } );
					this.log( 'info', 'request script|data: ' + i );
				}
				// set status to 'loading'
				lolist[ i ].status = 'loading';
			}
		}
	},
	
	/**
	 * load callback
	 */
	loadCallback: function( err, data, xhr, userData ){
	
		var t = userData.type,
		u = userData.url,
		i, j, k, relyList, relyTag = false, alias, reqName;
		
		if( !err ){
			this.log( 'info', 'resource loaded: ' + u );
			if( t != 'image' ){
				// get rely files
				relyList = this.getRely( data );
				
				// handle url to absolute, and get alias
				for( i = 0; relyList[ i ]; i++ ){
					alias = this.getAlias( relyList[ i ] );
					reqName = relyList[ i ].substring( 0, relyList[ i ].indexOf('.js') );
					if( reqName in this.requireList ){
						this.requireList[ reqName ] = util.handleUrl( relyList[ i ], u );
						this.requireList[ this.requireList[ reqName ] ] = {};
					}
					
					relyList[ i ] = util.handleUrl( relyList[ i ], u );

					if( alias != '' ){
						this.aliasList[ alias ] = relyList[ i ];
					}
				}
				
				// insert relyList before resource whose url is u
				for( i = 0; this.rcuList[ i ]; i++ ){
				
					for( j = 0; this.rcuList[ i ].url[ j ]; j++ ){
					
						if( this.rcuList[ i ].url[ j ] == u ){
							relyTag = true;
							// insert
							for( k = 0; relyList[ k ]; k++ ){
								this.rcuList[ i ].url.splice( j, 0, relyList[ k ] );
								j++;
							}
						}
					}
					if( relyTag ){
					
						// push relyList into rcuList[ i ].rely
						for( j = 0; relyList[ j ]; j++ ){
							// check wether relyList[ i ] in this.rcuList[ i ].rely
							if( !util.inStringArray( this.rcuList[ i ].rely, relyList[ j ] ) ){
								this.rcuList[ i ].rely.push( relyList[ j ] );
							}
						}
					}
				}
				
				// add relylist to loadingList
				this.addLoadingList( relyList );
			}
		}
		else {
			this.errorHandle( 'warning', 'resource load failed: ' + u );
		}
		
		// 若当前文件为一个模块，则处理
		if( u in this.requireList ){
			data = this.handleRequireData( data, u );
		}

		// remove from loadingList
		delete this.loadingList[ u ];
		// add to finishedList
		this.finishedList[ u ] = {
			data: data,
			type: t,
			err: err
		};
		// Through the array to see if there are resources need to be loaded
		this.loadResource();
		// update rcuList
		this.updateRcuList();
	},
	
	handleRequireData: function( data, url ){
		return "$r._requireModules['" + url + "'] = function(){ var exports = {}; \r\n" + data +
			"\r\n return exports; }";
	},
	/**
	 * get resource type by analysize url
	 * @param {String} url
	 * @return {String}
	 */
	getResType: function( url ){
		var c = this.config, i,
		scriptEx, dataEx, imgEx = scriptEx = dataEx = '\\w+\\.\(';
		for( i = 0; c.scriptSuffix[ i ]; i++ ){
			if( i == c.scriptSuffix.length - 1 ){
				scriptEx += ( '\(' + c.scriptSuffix[ i ] + '\)\)$' );
			}
			else {
				scriptEx += ( '\(' + c.scriptSuffix[ i ] + '\)\|' );
			}
		}
		for( i = 0; c.dataSuffix[ i ]; i++ ){
			if( i == c.dataSuffix.length - 1 ){
				dataEx += ( '\(' + c.dataSuffix[ i ] + '\)\)$' );
			}
			else {
				dataEx += ( '\(' + c.dataSuffix[ i ] + '\)\|' );
			}
		}
		for( i = 0; c.imageSuffix[ i ]; i++ ){
			if( i == c.imageSuffix.length - 1 ){
				imgEx += ( '\(' + c.imageSuffix[ i ] + '\)\)$' );
			}
			else {
				imgEx += ( '\(' + c.imageSuffix[ i ] + '\)\|' );
			}
		}
		scriptEx = new RegExp( scriptEx );
		dataEx = new RegExp( dataEx );
		imgEx = new RegExp( imgEx );
		if( scriptEx.test( url ) ){
			return 'script';
		}
		else if( dataEx.test( url ) ){
			return 'data';
		}
		else if( imgEx.test( url ) ){
			return 'image';
		}
		//@error
		else {
			this.errorHandle( 'warning', 'unknown resource type: ' + url );
		}
	},
	 
	/**
	 * get rely file
	 * @param {String} data
	 * @return {Array}
	 * @example $r._rely ( [ 'a.js',  'b.js' ] )	
	 * 	Add this to comments can achieve the same effect
	 */
	getRely: function( data ){
		
		var EX = /\$r\s*\.\s*_rely\s*\(\s*\[\s*([\w\.,'"\s]+)\s*\]\s*\)/,
		relyStr = EX.exec( data ), relyList;
		if( !relyStr ){
			relyList = [];
		}
		else {
			relyStr = relyStr[ 1 ];
			// Remove all the spaces and all quotes
			relyStr = relyStr.replace( /['"\s]/g, '' );
			relyList = relyStr.split( /,/ );
		}

		// 获取require模块
		// require同时也是rely，所以要添加到relyList中
		// 同时添加到requireList中，标记
		var REQ_EX = /\$r\s*\.\s*require\s*\(\s*['"]([\w\.\/]*)['"]\s*\)/g,
		reqStr, reqList;
		while(  reqStr = REQ_EX.exec( data ) ){
			if( !reqStr ){
				return relyList;
			}

			reqStr = reqStr[ 1 ];
			if( reqStr && reqStr != '' ){
				// 添加到模块列表中
				this.requireList[ reqStr ] = {};
				relyList.push( reqStr + '.js' );
			}
		}
		return relyList
	},
	
	/**
	 * add elem to loadingList
	 * @param {Array[Strin]}
	 */
	addLoadingList: function( list ){
		// check if they have been loaded
		for( i = 0; list[ i ]; i++ ){
			if( !( list[ i ] in this.finishedList ) && !( list[ i ] in this.loadingList ) ){
				this.loadingList[ list[ i ] ] = {
					status: 'wait',
					type: this.getResType( list[ i ] )
				};
			}
		}
	},
	 
	/**
	 * buildScript
	 * @param {Object} r -resource collection unit
	 * @param {Boolean} s default true
	 * @returns {String} if s set to true, then return the script to be execued, else return script array
	 */
	buildScript: function( r, s ){
	
		var i, j, relyIndex = {}, script = [], t, urlTemp = [];
		
		// copy url list
		for( i = 0; r.url[ i ]; i++ ){
			urlTemp.push( r.url[ i ] );
		}
		
		for( i = 0; r.url[ i ]; i++ ){
			t = this.finishedList[ r.url[ i ] ].type;
			if( t == 'script' ){
				// check if this resource have been execued
				if( this.scriptList[ r.url[ i ] ] && this.scriptList[ r.url[ i ] ] == 'execued' ){
					
					// remove from url list
					r.url.splice( i, 1 );
					i--;			
				}
			}
		}
		
		// Remove duplicate rely
		for( i = 0; r.rely[ i ]; i++ ){
		
			for( j = 0; r.url[ j ]; j++ ){
			
				if( r.url[ j ] == r.rely[ i ] ){
				
					if( !relyIndex[ r.rely[ i ] ] ){
						relyIndex[ r.rely[ i ] ] = j;
					}
					else if( j < relyIndex[ r.rely[ i ] ] ){
						r.url[ relyIndex[ r.rely[ i ] ] ] = undefined;
						relyIndex[ r.rely[ i ] ] = j;
					}
					else if( j > relyIndex[ r.rely[ i ] ] ){
						r.url[ relyIndex[ j ] ] = undefined;
					}
				}
			}	
		}
		
		// get all script resource into an array
		for( i = 0; r.url[ i ]; i++ ){
			t = this.finishedList[ r.url[ i ] ].type;
			if( t == 'script' ){
				script.push( this.finishedList[ r.url[ i ] ].data );
			}
		}
		// build Script
		return script = script.join('\n');
	},
	
	/**
	 * execute script
	 * @param {String} s
	 */
	runScript: function( s ){
		
		var scr = document.createElement('script');
		scr.type= "text/javascript" ;
		scr.text= s;
		// insert script to head
		document.getElementsByTagName("head")[0].appendChild(scr);
		
		// remove script
		document.getElementsByTagName("head")[0].removeChild(scr);
		this.log( 'info', 'resource [script] execued !' );
	},
	
	/**
	 * update rcuList
	 * Traverse rcuList to see if any is finished, then call the callback
	 * and save the module
	 */
	updateRcuList: function(){
		var i, j, finished = true, s, a,
		callback, userData;
		
		// tranverse url list
		for( i = 0; this.rcuList[ i ]; i++ ){
			
			for( j = 0; this.rcuList[ i ].url[ j ]; j++ ){
				if( !( this.rcuList[ i ].url[ j ] in this.finishedList ) ){
					finished = false;
					break;
				}
			}
			if( finished ){
				// save module
				if( this.rcuList[ i ].alias ){
					a = this.rcuList[ i ].alias;
				}
				else {
					a = this.moduleAliasPrefix + ( ++this.moduleAliasCounter );
				}
				this.moduleList[ a ] = this.initModule( this.rcuList[ i ] );
				
				// run script
				this.runScript( this.buildScript( this.rcuList[ i ] ) );
				// update scriptList
				for( j = 0; this.rcuList[ i ].url[ j ]; j++ ){
					if( this.finishedList[ this.rcuList[ i ].url[ j ] ].type == 'script' ){
						this.scriptList[ this.rcuList[ i ].url[ j ] ] = 'execued';
					}
				}
				
				// backup callback and userData
				callback = this.rcuList[ i ].callback;
				userData = this.rcuList[ i ].userData;
				
				// remove rcu
				this.rcuList.splice( i, 1 );
				
				// callback
				if( callback ){
					// pass module data to callback, an set context to window
					callback.call( window, this.moduleList[ a ], userData );
				}
				
				i--;
				this.log( 'info', 'a rcuList finished loading !' );
			}
			else {
				break;
			}
			finished = true;
		}
	},
	
	/**
	 * init module
	 * @param {Object} r resource collection unit
	 * @return {Object}
	 */
	initModule: function( r ){
		var m = {}, i, j;
		for( i in r.url ){
		
			m[ r.url[ i ] ] = this.finishedList[ r.url[ i ] ];
			// check if the resource has an alias
			for( j in this.aliasList ){
				if( this.aliasList[ j ] == r.url[ i ] ){
					m[ j ] = this.finishedList[ r.url[ i ] ];
					break;
				}
			}
		}
		return m;
	}
}
/**
 * relyJS API
 */
 
/**
 * load resource
 * 	url: [ 'a.js', 'b.png', 'http://neekey.net/importJS.js' ]	- resource url
 *	rely: [ 'c.js', '../d.js' ],	- rely resource url
 *	alias: 'module',	- the name of this collection, optional
 *	callback: fn,	
 *	userData: ,	- custom data pass to callback
 */
$r.load = function( o ) {
	
	var alias;
	BASE_PATH = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
	
	// if url not specified
	if ( !o || !o.url ){
		pri.errorHandle( 'warning', '[ $r.load ] illegal argument ! url must be given!' );
		return this;
	}
	else {
		// check url data type
		if( typeof o.url == 'string' || o.url.constructor == Array ) {
		
			// check rely, alias, callback
			// if illegal, set to undefined
			if( !o.rely || !( typeof o.rely == 'string' || o.rely.constructor == Array ) ){
				o.rely = [];
			}
			else if( typeof o.rely == 'string' ){
				o.rely = [ o.rely ];
			}
			if( o.alias && typeof o.alias != 'string' ){
				o.alias = undefined;
			}
			if( o.callback && typeof o.callback != 'function' ){
				o.callback = undefined;
			}
			if( typeof o.url == 'string' ){
				o.url = [ o.url ];
			}
			// handle URL and store alias
			for( i = 0; o.url[ i ]; i++ ){
				alias = pri.getAlias( o.url[ i ] );
				o.url[ i ] = util.handleUrl( o.url[ i ], BASE_PATH );
				if( alias != '' ){
					pri.aliasList[ alias ] = o.url[ i ];
				}
			}
			for( i = 0; o.rely && o.rely[ i ]; i++ ){
				alias = pri.getAlias( o.rely[ i ] );
				o.rely[ i ] = util.handleUrl( o.rely, BASE_PATH );
				if( alias != '' ){
					pri.aliasList[ alias ] = o.rely[ i ];
				}
			}
			
			// initialize resource collection unit
			pri.initRcu( o );
			pri.loadResource();
			// update rcuList
			pri.updateRcuList();
			return this;
		}
		else {
			pri.errorHandle( 'warning', '[ $r.load ] illegal argument ! the data type of url must be String or Array!' );
			return this;
		}
	}
};

/**
 * specify files the resource need rely on
 */
$r.rely = function( rely ) {
	// check data type
	if( rely.constructor == Array ){
		var r = pri.rcuList[ pri.rcuList.length - 1 ];
		// insert to the top of r.url
		r.url = rely.concat( r.url );
		r.rely = rely.concat( r.rely );
		// add url to loadingList
		pri.addLoadingList( r.url );
		pri.loadResource();
		// update rcuList
		pri.updateRcuList();
	}
	else {
		this.errorHandle( 'warning', '[ $r.rely ] illegal argument ! the data type of rely must be Array!' );
	}
	return this;
};
	
/**
 * configuration
 */
$r.config = function( cfg ) {
	var i;
	for( i in cfg ){
		if( i == 'scriptSuffix' || i == 'dataSuffix' || i == 'imageSuffix' || i == 'log' ){
			pri.config[ i ] = cfg[ i ];
		}
	}
	return this;
};

/**
 * get resource by url | module name
 */
$r.getRes = function( name ) {
	var URL_EX = /^http\:\/\/.+$|^https\:\/\/.+$/;
	
	if( !name ){
		return ;
	}
	// if name is an absolute url 
	else if ( name in pri.finishedList ) {
		return pri.finishedList[ name ];
	}
	// or it's an alias
	else if ( name in pri.aliasList ){
		return pri.finishedList[ pri.aliasList[ name ] ];
	}
	else return false;
};

/**
 * get module
 */
$r.getModule = function( name ){
	if( name && name in pri.moduleList ){
		return pri.moduleList[ name ];
	}
	else return false;
};

/**
 * 记录模块方法
 */
$r._requireModules = {};

/**
 * 导入模块，只能在js文件中被使用(这个js文件需要以$load的方式被载入)
 */
$r.require = function( mName ){
	return this._requireModules[ pri.requireList[ mName ] ]();
};
/**
 * this function does nothing, 
 * just a Identifier for you to import other resource in a resource
 * @param {Array}
 */
$r._rely = function(){};

/**
 * return the logList
 */
$r.log = function(){
	return pri.logList;
}
 
})();

