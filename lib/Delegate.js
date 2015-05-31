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

/**
 * @class Delegate
 * @mixes $thing.Base
 * @memberOf $thing
 */
$thing.Delegate = $thing.Base.inherit({

    init: function() {
        this.$super();

    },

    getName: function() {
        return 'Delegate';
    },

    /**
     * @memberOf $thing
     * @method Delegate#getInterfaces
     * @returns {string[]}
     */
    getInterfaces: function() {
        return [];
    },

    /**
     * @memberOf $thing
     * @method Delegate#matchInterface
     * @param {string} pattern
     * @param {string} source
     * @returns {string}
     */
    matchInterface: function(pattern) {
        var interfaces = this.getInterfaces();

        for(var i = 0; i < interfaces.length; i++)
            if ((interfaces[i] instanceof RegExp)
                ? pattern.match(interfaces[i]) !== null
                : interfaces[i] === pattern
            ) break;
            
        return interfaces[i];
    },

    /**
     * @memberOf $thing
     * @method Delegate#refObject
     */
    refObject: function(cb) {
        cb(this, function(){});
    },

    /**
     * @memberOf $thing
     * @method Delegate#dispatch
     * @param {object} call
     */
    dispatch: function(call, cb) {
        var method,
            signature,
            predicates,
            args,
            ontology = false,
            self = this
            ;

        cb = cb || function() {};
            
        // Don't dispatch to unpatched delegates
        if (typeof this.getRefCount === 'undefined') return cb();

        // Don't dispatch to methods with $ prefix 
        if (call.method.charAt(0) === '$') return cb(); 

        // Check for method name prefixed with interface
        (this[method = call.interface + '.' + call.method] === undefined)
            ? (this[method = call.method] === undefined)
                ? method = undefined
                : undefined
            : undefined
            ;

        // Check for ontology
        for (ontology in this.$ontology) break;
            
            // Check method has a name
        (   method === undefined ||
            // Does the signature for the method exist
            (signature = this.$signatures[method]) === undefined ||
            // Signature must have atleast 1 argument
            signature.length < 1 ||
            // Last argument of signature must be prefixed with $ 
            signature[signature.length - 1].charAt(0) !== '$' ||
            // Number of signature arguments must match the number of
            // call arguments plus callback object
            signature.length !== call.args.length + 1
        )
            // Didn't match, check for catch all
            ? ( this[method = this.$__catchall__] === undefined ||
                // Catch all signature must exist
                (signature = this.$signatures[method]) === undefined ||
                // Last argument is prefixed with $
                signature[1].charAt(0) !== '$' ||
                // 2 arguments
                signature.length !== 2
            )
                // Didn't match, skip call
                ? cb()
                // Matched, call catch all
                : this[this.$__catchall__].apply(
                    this,
                    [call.args, cb]
                )
            // Matched
            : (!ontology || this.$signatures[method].length === 1)
                // 0 call arguments or empty ontology, make call
                ? this[method].apply(this, $thing.arrayAppend(call.args, cb))
                // Compact with ontology 
                : $thing.jsonld.compact({
                        '@graph': 
                            (predicates = Object.keys(
                                args = $thing.arrayToObject(
                                    call.args, 
                                    this.$signatures[method],
                                    function(value) {
                                        return value && 
                                            value.constructor === Object &&
                                            typeof value['@context'] !== 'undefined'
                                            ;
                                    }
                                )
                            ))
                            .map(function(k) {
                                return args[k];
                            })
                    },
                    this.$ontology, {
                        graph: true
                    },
                    function(err, graph) {
                        if (err) return;

                        graph = graph['@graph'];
                        args = [];

                        if (graph.length === predicates.length) {
                            // All ok, make call
                            
                            graph = $thing.merge(
                                $thing.arrayToObject(
                                    graph,
                                    predicates
                                ),
                                $thing.arrayToObject(
                                    call.args,
                                    self.$signatures[method]
                                )
                            );

                            for (   var i = 0; 
                                    i < self.$signatures[method].length - 1; 
                                    i++
                            )
                                args[i] = graph[self.$signatures[method][i]];

                            args.push(cb);

                            self[method].apply(self, args);

                        }

                    }
                )
                ;
    }

});