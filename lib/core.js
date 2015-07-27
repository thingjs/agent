/*
Copyright (c) 2015 Simon Cullen, http://github.com/cullens

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/
'use strict';

/** @namespace $thing */

$thing.Mash = function() {
    // Mash by Johannes Baagoe <baagoe@baagoe.com>
    var n = 0xefc8249d;
    var mash = function(data) {
        data = data.toString();
        for (var i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            var h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 0x100000000; 
        }
        return (n >>> 0) * 2.3283064365386963e-10; 
    };
    return mash;
};

/**
 * @memberOf $thing
 * @method create64BitId
 */
$thing.create64BitId = function() {
    var h1 = new $thing.Mash(),
        h2 = new $thing.Mash()
        ;

    for (var i = 0; i < arguments.length; i++) 
        h1(arguments[i] || '');

    return  h1('').toString(16).split('.')[1] +
            h2($thing.getMicroTime()).toString(16).split('.')[1]
            ;
};

/**
 * @memberOf $thing
 * @method merge
 */
$thing.merge = function() {
    var args = $thing.arrayDup(arguments),
        obj = args[0],
        i = 1
        ;
        
    for(; i < args.length; i++)
        if (args[i] !== undefined)
            for(var k in args[i])
                (obj[k] === undefined)
                    ? obj[k] = args[i][k]
                    : undefined
                    ;

    return obj;
};

/**
 * @memberOf $thing
 * @method arrayDup
 */
$thing.arrayDup = function(src, length, destroySrc, retainLength) {
    var i,
        l = length || src.length,
        dest = new Array(length || src.length)
        ;

    if (destroySrc === undefined || destroySrc === false)
        for (i = 0; i < l; i++)
            dest[i] = src[i];
    else {
    
        for (i = 0; i < l; i++) {
            dest[i] = src[i];
            src[i] = undefined;
        }
    
        if (retainLength === undefined)
            src.length = 0;
        else if (src.length > retainLength)
            src.length = retainLength;

    }

    return dest;
};

/**
 * @memberOf $thing
 * @method objectDup
 */
$thing.objectDup = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * @memberOf $thing
 * @method objectDupMeta
 */
$thing.objectDupMeta = function(obj) {

    obj = JSON.stringify(obj, function(key, value) {

        if (key.charAt(0) === '@') 
            return value;

        if (typeof value === 'object')
            for (var k in value)
                if (k.charAt(0) === '@')
                    return value;

        return undefined;

    });

    return (obj === undefined) ? obj : JSON.parse(obj);
};

/**
 * @memberOf $thing
 * @method arrayAppend
 */
$thing.arrayAppend = function(src, value) {
    var l = src.length,
        dest = new Array(l + 1)
        ;

    for (var i = 0; i < l; i++)
        dest[i] = src[i];

    dest[l] = value;

    return dest;
};

/**
 * @memberOf $thing
 * @method arrayToObject
 */
$thing.arrayToObject = function(values, predicates, cbTestFunc) {
    var obj = {};

    predicates = predicates || [];

    for (var i in values)
        if (!cbTestFunc || cbTestFunc(values[i]))
            obj[predicates[i] || i] = values[i];

    return obj;
};

/**
 * @memberOf $thing
 * @method xorDistance
 */
$thing.xorDistance = function(x, y) {
    if (x === y) return 0;

    var l,
        a = 0,
        mashX = new $thing.Mash(),
        mashY = new $thing.Mash()
        ;

    x = mashX(x).toString();
    y = mashY(y).toString();

    l = Math.min(x.length, y.length);

    for (var i = 2; i < l; i++)
        a += x.charCodeAt(i) ^ y.charCodeAt(i);

    return a;
};

/**
 * @memberOf $thing
 * @method applyCatchError
 */
$thing.applyCatchError = function(funct, self, args, $cb) {

    try {

        return funct.apply(self, args);

    }
    catch(err) {

        $cb('onError', err)();

    }

};

/**
 * @memberOf $thing
 * @method $container
 */
$thing.containers = {
    main: {
        source: '$thing',
        heap: [] 
    }    
};

$thing.$container = function(cb) {
    $thing.getContainer($thing.getThreadId(1));
    cb();
};

/**
 * @memberOf $thing
 * @method getContainer
 */
$thing.getContainer = function(threadId) {
    var container = $thing.containers[threadId[1]],
        parent = $thing.containers[threadId[2]]
        ;

    if (container === undefined) {

        container = $thing.containers[threadId[1]] = {
            heap: []
        };

        if (threadId[1] !== threadId[2] && parent !== undefined)
            for (var k in parent.heap)
                if (parent.heap[k].isAbstract)
                    container.heap.push(parent.heap[k]);

    }

    return container;
};

/**
 * @memberOf $thing
 * @method attach
 */
$thing.attach = function(def, heap) {

    if (def._id !== undefined) 
        return def._id;
    else {
        var length = heap.length;
        
        while(heap.length !== 0 &&
            heap[heap.length - 1]._refCount === 0
        ) 
            (heap.pop())._id = undefined;
        
        if (!heap.length || heap.length !== length)
            def._id = heap.push(def) - 1;
        else {
            def._id = undefined;
            
            for(var i = heap.length - 1;
                i > -1 && def._id === undefined;
                i--
            )
                if (heap[i]._refCount === 0) {
                    heap[i]._id = undefined;
                    heap[def._id = i] = def;
                }
            
            if (def._id === undefined)
                def._id = heap.push(def) - 1;
        }
        
        return def._id;
    }
};

/**
 * @memberOf $thing
 * @method search
 */
$thing.search = function(obj, heap) {
    var match;
    
    for(var i = heap.length - 1; i > -1; i--) {
        if (heap[i]._refCount > 0) {
            for(var k in obj)
                if (!(match = obj[k] === heap[i][k]))
                    break;
                
                if (match)
                    return heap[i];
            }
        }
    
    return undefined;
};

/**
 * @memberOf $thing
 * @method searchMeta
 */
$thing.searchMeta = function(obj, predicate) {
    var type = 'tokens',
        cb = arguments[2],
        meta = (obj.getMeta !== undefined)
            ? obj.getMeta()
            : obj._meta
        ;
    
    switch(arguments[2]) {
        case '':
            /* falls through */
        case 'boolean':
            /* falls through */
        case 'int':
            /* falls through */
        case 'float':
            /* falls through */
        case 'string':
            /* falls through */
        case 'tokens':
            type = arguments[2];
            cb = arguments[3];
    }
    
    if (type === '') return;

    meta.forEach(function(item) {
        var tokens = item.match(/\S+/g);
        
        if (tokens !== null && tokens[0] === predicate) {

            tokens = tokens.slice(1);
            
            switch(type) {

                case 'boolean':
                    switch(tokens[0].toLowerCase()) {
                        case 'true':
                            tokens[0] = true;
                            cb.apply(obj, tokens);
                            break;
                        
                        case 'false':
                            tokens[0] = false;
                            cb.apply(obj, tokens);
                            break;
                    }
                    break;

                case 'int':
                    if (!isNaN(tokens[0] = parseInt(tokens[0])))
                        cb.apply(obj, tokens);
                    break;

                case 'float':
                    if (!isNaN(tokens[0] = parseFloat(tokens[0])))
                        cb.apply(obj, tokens);
                    break;

                case 'string':
                    cb.apply(obj, [item.slice(predicate.length + 1)]);
                    break;
                
                case 'tokens':
                    /* falls through */
                default:
                    cb.apply(obj, tokens);

            }

        }

    });
};

/**
 * @memberOf $thing
 * @method cbBuilder
 */
$thing.cbBuilder = function(threadId, self, args, cbDone) {
    cbDone = cbDone || function(){};
    
    $thing.Tasker.thread(threadId);
        
    if (args.length === 0) cbDone();
    else {

        return function() {
                
            $thing.agent(self)
                .apply($thing, args)
                .apply($thing, arguments.length ? arguments : [$thing.Container]);
            
            cbDone();
        };

    }
    
};

/**
 * @method agent
 * @param {*}
 */
var agent = $thing.agent = function() {
    var cb,
        def,
        threadId,
        selector,
        filter,
        pattern,
        selects,
        callChain,
        inlineDef,
        inlineAgentId,
        inlineThreadId,
        prevInlineAgentId,
        inlineObj = $thing.Container,
        refCount = 0
        ;

    switch(arguments.length) {
        case 0:
            return $thing.Tasker.thread($thing.getThreadId(1));
        
        case 2:
            if (typeof arguments[1] === 'function')
                cb = arguments[1];

            /* falls through */    
        case 1:
            if (arguments[0] instanceof $thing.Pattern) {
                pattern = arguments[0];
                threadId = pattern.getThreadId();
                selector = new $thing.Selector(threadId, pattern, true);
                break;
            }
            else if (   typeof arguments[0] === 'object' &&
                        arguments[0].getInterfaces !== undefined
            ) {
                selector = arguments[0];
                threadId = selector.getThreadId();
                break;
            }

            /* falls through */
        default:            
            def = new $thing.Definition(
                $thing.Container,
                $thing.Agent,
                threadId = $thing.getThreadId(1),
                $thing.arrayDup(arguments)
            );

            if (def.class !== undefined)
                return def.refObject(function(obj, cbRelease) {
                    cbRelease();
                });
            else {
                selects = [];
                
                $thing.searchMeta(def, 'select', function() {
                    selects.push($thing.arrayDup(arguments));
                });
                
                selector = new $thing.Selector(
                    threadId,
                    pattern = (selects.length) ? selects : def.name,
                    true
                );
            }
    }

    filter = function(filters, callArgs) {

        if (arguments.length === 2 &&
            typeof callArgs[0] === 'string' &&
            callArgs[0].charAt(0) === '^'
        ) {

            if (inlineDef === undefined) {

                inlineDef = {
                    
                    setup: function(cb) {
                        
                        this.$ontology = undefined;

                        this.$super(cb);

                    }
                
                };

                inlineThreadId =  $thing.getThreadId(2);
                
            }

            callArgs[0] = callArgs[0].substring(1);

            if (typeof inlineDef[callArgs[0]] === 'undefined')
                inlineDef[callArgs[0]] = callArgs[1];
            else
                throw new Error(callArgs[0] + ' already defined');

            return callChain;
        }

        return function() {
            var obj;

            switch(arguments.length) {
                case 0:
                    if (inlineDef === undefined) 
                        obj = inlineObj;
                    else {

                        obj = inlineObj = new $thing.Definition(
                            $thing.Container,
                            $thing.Agent,
                            inlineThreadId, 
                            (prevInlineAgentId === undefined) 
                                ? [ inlineAgentId = $thing.create64BitId(inlineThreadId[0]),
                                    inlineDef
                                ]
                                : [ inlineAgentId = $thing.create64BitId(inlineThreadId[0]), 
                                    'extends', 
                                    prevInlineAgentId, 
                                    inlineDef
                                ]
                        );

                        inlineDef = undefined;
                        
                        prevInlineAgentId = inlineAgentId;

                    }

                    break;
                
                case 1:
                    if (typeof arguments[0] === 'object' &&
                        arguments[0].getInterfaces !== undefined
                    ) {
                        obj = arguments[0];
                        break;
                    }
                    
                    /* falls through */ 
                default:
                    def = new $thing.Definition(
                        $thing.Container,
                        $thing.Agent,
                        $thing.getThreadId(1),
                        $thing.arrayDup(arguments)
                    );
                    
                    if (def.class !== undefined) 
                        obj = def;
                    else {
                        selects = [];
                        
                        $thing.searchMeta(def, 'select', function() {
                            selects.push($thing.arrayDup(arguments));
                        });
                        
                        obj = new $thing.Pattern(
                            threadId,
                            (selects.length) ? selects : def.name
                        );
                    }
                    
                    break;
            }

            obj.refObject(function(obj, cbRelease) {

                refCount++;

                if (pattern === undefined) {

                    selector.dispatch(
                        {   caller: def,
                            filters: filters,
                            method: callArgs[0],
                            args: callArgs.slice(1)
                        },
                        function() {

                            return $thing.cbBuilder(
                                threadId,
                                obj,
                                arguments,
                                function() {

                                    if (--refCount === 0) {

                                        if (cb !== undefined) cb();

                                        cbRelease();

                                    }

                                }
                            );
                        }
                    );

                }
                else {

                    selector.select();

                    selector.schedule();

                    selector.dispatch(
                        {   caller: def,
                            filters: filters,
                            method: callArgs[0],
                            args: callArgs.slice(1)
                        },
                        function() {

                            return $thing.cbBuilder(
                                threadId,
                                obj,
                                Array.prototype.slice.call(
                                    arguments,
                                    0,
                                    arguments.length - 1
                                ),
                                arguments[arguments.length - 1]
                            );
                        },
                        function() {

                            if (refCount > 1) refCount--;
                            else {

                                $thing.async.setImmediate(function() {

                                    if (--refCount === 0) {

                                        if (cb !== undefined) cb();

                                        cbRelease();
                                    
                                        selector.release();
                                    
                                    }

                                });

                            }

                        }
                    );

                }

            });

            return callChain;
        };
    };

    callChain = function() {

        return filter($thing.Filter.ALL, $thing.arrayDup(arguments));
    };

    callChain.all = callChain;

    callChain.first = function() {

        return filter($thing.Filter.FIRST, $thing.arrayDup(arguments));
    };

    callChain.last = function() {

        return filter($thing.Filter.LAST, $thing.arrayDup(arguments));
    };

    callChain.closest = function() {

        return filter($thing.Filter.CLOSEST, $thing.arrayDup(arguments));
    };

    return callChain;
};