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
                var flow,
                    names,
                    namesDict = {},
                    self = this
                    ;
                    
                for (var i = 0; i < arguments.length; i++) 
                    namesDict[arguments[i]] = i;
              
                $thing.searchMeta(this, 'flow', function() {

                    for (var j = 0; j < arguments.length; j++)  
                        namesDict[arguments[j]] = j + i;

                    i += j;

                });

                names = Object.keys(namesDict);
                
                flow = new Array(names.length);
 
                names.forEach(function(name, index) {

                    flow[index] = function() {
                        var args = new Array(arguments.length);

                        args[0] = name;

                        for (var i = 0; i < arguments.length - 1; i++)
                            args[i + 1] = arguments[i];

                        $thing.agent(self, arguments[arguments.length - 1])
                            .apply(self, args)
                            .apply(self, [self])
                            ;

                    };

                });

                flow.remove = function(name) {
                    var k,
                        l = 0,
                        index = namesDict[name]
                        ;

                    if (index !== -1) {
                        
                        namesDict[name] = -1;

                        flow[index] = function() { 

                            arguments[arguments.length - 1]();

                        };

                    }

                    for (k in namesDict)
                        if (namesDict[k] !== -1) break;
                        else l++;

                    if (flow.length === l)
                        this.removeAll();

                };

                flow.removeAll = function() {

                    namesDict = {};

                    flow.length = 0;

                };
    
                this.getFlow = function() {
                    
                    return flow;
                };

                return flow;
            },

            end: function(methodName, $cb) {
                var flow = this.getFlow();

                if (methodName instanceof Array)
                    for(var k in methodName)
                        flow.remove(methodName[k]);
                else 
                    flow.remove(methodName);

                if ($cb) $cb();

            },

            endAll: function($cb) {

                 this.getFlow().removeAll();

                 if ($cb) $cb();

            },
            
            action: function($cb) {

                if (this.getFlow().length === 0)
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