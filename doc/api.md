This project is developed to solve the problem I encountered in my html5 game-project, which i have to finished loading all the resource the game need.

This project can be used to load the script files, plain data files (html, css, JSON), images, etc.

## Resource type
----
there are three main data type relyJS can load

- script

*like .js file, or any file you want it to be executed after loaded.*

- data

*like .xml, json etc. files you want to store data or info. these data will be saved as plain string.*

- image

*like .png, .bmp etc, saved as ImageElement*

## Chain method calls
----
you can use relyJS like this:

    $r.config()
        .load().rely()
        .load();

## Module
----
Every call of $r.load() will generate a module. in relyJS, module is a group of resource.
you can get module using $r.getModule(alias) ( see API $r.getModule() ), every module like this:

assume the base path is 'http://neekey.net/':

    $r.load( { url: ['a.js scriptAlias', 'b.png imgAlias', 'c.json'], alias: 'myModule' });

then, module 'myModule' will be an object like this:

    {
        http://neekey.net/a.js: '...',
        scriptAlias: '...',
        http://neekey.net/b.png: imgElem,
        imgAlias: imgElme,	// realized that alias and absolute url point to the same resource
        http://neekey.net/c.json: '...'
    }

## Rely
----
relyJS provide three way to specified 'rely' resources

- set rely in $r.load()


    $r.load( {url: [ 'a.js' ], rely: [ 'b.js' ] } );

- $r.rely()

    $r.load( {url: [ 'a.js' ]} ).rely( [ 'b.js' ] );

- use $r._rely() in resource files

in a.js file:

    $r._rely([ 'b.js' ] );
    /* main code in a.js */

## Callback
----
there are two params will be sent to callback

- module

    @see module

- userData

userData specified in $r.load(), @see api $r.load()

## API
----
###$r.load()
---
method to load resource.

@param {Object}

- url: ['a.js','b.png','c.html']

*the url of the resource,You can use a relative address or an absolute address*

- rely: ['c.js','d.png','f.json']

***optional**, the resource you want to load before 'url' list*

- alias: 'module'

***optional**, every call of $r.load, the resource gorup can be treated as a modual, for you to use them as a group*

- callback: function( module, userData ){}

***optional**, the callback function*

- userData: 'neekey'

***optional**, any type, pass to callback as a custom param*

###$r.rely()
---
this method does same thing you add specified rely in $r.load()

below:

    $r.load({ url: ['a.js'], rely: ['b.js'] });

the same as:

    $r.load({ url: ['a.js'] }).rely( ['b.js'] );

so remember $r.rely() must be called after $r.load()

###$r.getRes()
---
this method lets you to get resource which has finished loading by alias or the absolute resource url

you can set alias like this:

    $r.load( {
        url: [ 'a.js scriptAlias' ],
        callback: function(){
            var res = $r.getRes('scriptAlias');
        } } );

you can also use this way in $r.rely() and $r._rely()

###$r.getModule()
---
this method lets you to get module which has finished loading by alias you specified or automatically generated

you can set alias like this:

    $r.load( {
        url: [ 'a.js', 'b.js' ],
        alias: 'myModule',
        callback: function(){
            var module = $r.getModule('myModule');
        } } );

however, if alias is not set in $r.load, relyJS will automatically generated like 'module_1'

###$r.config()
---
this method lets you to configure relyJS, and the way to determine resource type is mainly about

example:

    $r.config({
        scriptSuffix: ['js'],
        dataSuffix: ['json', 'hmtl'],
        imageSuffix: ['png', 'gif', 'jpg', 'bmp']
    });

###$r.log()
---
this method return info about the implementation of relyJS, which is stored as an array.