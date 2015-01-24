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

$thing.agent('@singleton', {
    
    setup: function(cb) {
        this.$super(cb);

        /**
         * @class Flow
         * @abstract
         * @mixes $thing.Behaviour
         */
        this.addBehaviour('abstract Flow', {

            /**
             * @method Flow#getFlow
             * @returns {function[]}
             */
            getFlow: function() {
                var self = this,
                    reset = this.reset,
                    getFlow = this.getFlow,
                    methods = [],
                    names = [],
                    args = Array.prototype.slice.call(arguments, 0)
                    ;
                    
                args.forEach(function(item) {
                    if (names.indexOf(item) === -1)
                        names.push(item);
                });
                    
                $thing.searchMeta(this, 'flow', function() {
                    Array.prototype.slice.call(arguments, 0).forEach(
                        function(item) {
                            if (names.indexOf(item) === -1)
                                names.push(item);
                        }
                    );
                });

                names.forEach(function(item) {
                    if (self.$signatures[item] !== undefined &&
                        self.$signatures[item]
                        [self.$signatures[item].length - 1].charAt(0) === '$'
                    )
                        methods.push(function() {
                            var cbYield = arguments[arguments.length - 1],
                                args = Array.prototype.slice.call(
                                    arguments,
                                    0,
                                    arguments.length - 1
                                )
                                ;
                                
                            args.push(function() {
                                var args = arguments;
                                    
                                return (args.length === 0)
                                    ? cbYield()
                                    : function() {
                                        // This needs improvement                                  
                                        $thing.agent(new ($thing.Agent.inherit({

                                            done: function($cb) {
                                                var i = names.indexOf(item);
                                                    
                                                names.splice(i, 1);
                                                methods.splice(i, 1);
                                                
                                                $cb();
                                                cbYield();
                                            },
                                                    
                                            yield: function($cb) {
                                                $cb();
                                                cbYield();
                                            }

                                        }))())
                                        .apply($thing, args)
                                        .apply($thing, [])
                                        ;
                                    }
                                    ;
                            });
                            
                            self[item].apply(self, args);
                        
                        });
                               
                });
                    
                this.reset = function(cb) {
                    this.getFlow = getFlow;
                    return reset.apply(this, [cb]);
                };
                    
                this.getFlow = function() {
                    return methods;
                };
                    
                return methods;
            },

            action: function($cb) {
                if (!this.getFlow().length)
                    this.done = function() {
                        return true;
                    };
                            
                this.$super($cb);
            },
                
            done: function() {
                return false;
            }

        });
    }

});