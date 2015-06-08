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
         * @class MapReduce
         * @mixes Queue
         * @abstract
         */
        this.addBehaviour('abstract MapReduce extends Queue', {

            getMapReduce: function() {
                var keys = {},
                    values = [],
                    lengths = [],
                    last = 0,
                    shape = 1,
                    total = 0,
                    reduceIndex = 0,
                    drainRefs = 0,
                    pushes = [],
                    self = this,
                    getMapReduce = this.mapReduce,
                    mapReduce = {

                        write: function(key, value) {
                            var index;

                            if (last === values.length) {

                                values = $thing.arrayDup(
                                    values, 
                                    (1 + values.length) * 2, 
                                    true
                                );
                                
                                lengths = $thing.arrayDup(
                                    lengths, 
                                    (1 + lengths.length) * 2, 
                                    true
                                );

                                for (var i = last; i < lengths.length; i++) {
                                    lengths[i] = 0;
                                    values[i] = new Array(shape);
                                }

                            }

                            if ((index = keys[key]) === undefined) {
                                index = keys[key] = last;
                                last++;
                            }

                            if (lengths[index] === values[index].length) {

                                values[index] = $thing.arrayDup(
                                    values[index], 
                                    Math.max((1 + values[index].length) * 2, shape), 
                                    true
                                );

                            }

                            values[index][lengths[index]] = value;

                            lengths[index]++;

                            shape = Math.ceil(++total / last);

                        },

                        reduce: function(values, cb) {
                        
                            if (values !== undefined)
                                for(var k in pushes)
                                    pushes[k]('push', values)(self);

                            cb();

                        },

                        drain: function() {

                            if (++drainRefs === 1) {

                                self.pause();

                                self.unsetState($thing.State.LIFE_WAITING);

                            }

                        },

                        action: function($cb) {
                            var start = $thing.getMicroTime(),
                                valuesCopy = $thing.arrayDup(
                                    values[reduceIndex],
                                    lengths[reduceIndex],
                                    true,
                                    shape
                                )
                                ;
                            
                            lengths[reduceIndex] = 0;

                            self.reduce(valuesCopy, function() {

                                if (++reduceIndex === last) {
                                    var l = (1 + last) * 2;

                                    if (values.length > l) {
                                        values.length = l;
                                        lengths.length = l;
                                    }

                                    keys = {};

                                    drainRefs = last = reduceIndex = 0;

                                    self.resume();
                                }

                                self.burstTime($thing.getMicroTime() - start);

                                $cb();

                            });

                        },

                        reset: function() {

                            keys = {};
                            values.length = 0;
                            lengths.length = 0;

                            mapReduce = undefined;

                            self.getMapReduce = getMapReduce;

                        }

                    }
                    ;

                $thing.searchMeta(this, 'push', 'string', function(selector) {
                
                    pushes.push($thing.agent(selector));
                
                });

                Object.defineProperty(mapReduce, 'length', {
                    get: function() {
                        return total;
                    }
                });

                Object.defineProperty(mapReduce, 'isReducing', {
                    get: function() {
                        return drainRefs > 0 && last > 0;
                    }
                });

                this.getMapReduce = function() {
                    
                    return mapReduce;
                };

                return mapReduce;
            },

            action: function($cb) {
                var mapReduce = this.getMapReduce();

                if (mapReduce.isReducing)
                    mapReduce.action($cb);
                else
                    this.$super($cb);

            },

            reset: function($cb) {

                this.getMapReduce().reset();

                this.$super($cb);
            },

            write: function(key, value) {

                this.getMapReduce().write(key, value);

            },

            reduce: function(values, cb) {

                this.getMapReduce().reduce(values, cb);

            },

            drain: function(cb) {

                this.getMapReduce().drain();

                this.$super(cb);
            }

        });
    }

});