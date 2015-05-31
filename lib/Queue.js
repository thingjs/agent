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
         * @class Queue
         * @mixes Flow
         * @abstract
         */
        this.addBehaviour('abstract Queue extends Flow', {
        
            /**
            * @method Queue#getQueue
            */
            getQueue: function() {
                var chunks,
                    callbacks,
                    i = 0,
                    x = 0,
                    y = 0,
                    last = 0,
                    queueLength = 0,
                    limit = 0,
                    concurrency = 1,
                    active = 0,
                    paused = false,
                    self = this,
                    queue = {

                        action: function() {

                            if (chunks.length === 0) return;

                            for(    var j = 0, flow = self.getFlow();

                                    flow.length > 0 &&
                                    j + active < concurrency + 1 && 
                                    i < queueLength; 
                                    
                                    j++, i++
                            ) {

                                var v,
                                    $cb,
                                    start = $thing.getMicroTime()
                                    ;

                                if (chunks[y] instanceof Array) {
                                    
                                    v = chunks[y][x];

                                    if (x < chunks[y].length - 1) x++;
                                    else {

                                        $cb = callbacks[y];

                                        chunks[y] = undefined;
                                        callbacks[y] = undefined;

                                        x = 0;
                                        y++;

                                    }

                                }
                                else {

                                    v = chunks[y];

                                    $cb = callbacks[y];

                                    chunks[y] = undefined;
                                    callbacks[y] = undefined;

                                    x = 0;
                                    y++;

                                }

                                active++;

                                $thing.async.applyEachSeries(
                                    flow, 
                                    v,
                                    function() {

                                        self.burstTime($thing.getMicroTime() - start);

                                        if ($cb) $cb('onComplete')();
                                        
                                        active--;
                                    
                                    }
                                );

                            }

                            if (i === queueLength) {
                                var l = Math.max(chunks.length / 2, limit, 1);

                                queueLength = last = i = x = y = 0;
                            
                                if (limit === 0 && chunks.length > l) {
                                    chunks.length = l;
                                    callbacks.length = l;
                                }

                            }

                            if (queueLength === 0 && limit > 0)
                                self.setState($thing.State.LIFE_WAITING);
                            else if (queueLength === 0 && chunks.length === 1)
                                self.setState($thing.State.LIFE_WAITING);

                        },

                        push: function(items, $cb) {
                            var length = items instanceof Array
                                ? queueLength + items.length
                                : queueLength + 1
                                ;

                            if (self.getFlow() === 0)
                                return $cb('onError', -1)();

                            if (limit > 0 && length > limit)
                                return $cb('onError', -1)();

                            queueLength = length;

                            if (last === chunks.length) {

                                //chunks = chunks.concat(chunks);
                                //callbacks = callbacks.concat(callbacks);

                                chunks = $thing.arrayDup(chunks, chunks.length * 2, true);
                                callbacks = $thing.arrayDup(callbacks, callbacks.length * 2, true);

                            }

                            chunks[last] = items;
                            callbacks[last] = $cb;

                            last++;

                            if (!paused)
                                self.unsetState($thing.State.LIFE_WAITING);

                        },

                        clear: function() {

                            i = queueLength;

                            $thing.async.each(
                                callbacks.slice(y),
                                function(cbItem, cbNext) {

                                    cbItem('onError', -1)();

                                    cbNext();

                                }
                            );
                
                        },

                        pause: function($cb) {

                            paused = true;

                            self.setState($thing.State.LIFE_WAITING);

                            $cb();

                        },

                        resume: function($cb) {

                            if (queueLength > 0)
                                self.unsetState($thing.State.LIFE_WAITING);

                            paused = false;

                            $cb();

                        }

                    }
                    ;

                $thing.searchMeta(this, 'concurrency', 'int', function(value) {

                    concurrency = value;
                
                });
            
                $thing.searchMeta(this, 'limit', 'int', function(value) {
                
                    limit = value;
                
                });

                chunks = new Array(limit || 1);
                callbacks = new Array(limit || 1);

                this.getQueue = function() {
                    
                    return queue;
                };

                return queue;
            },

            action: function($cb) {

                this.getQueue().action();

                this.$super($cb);

            },
    
            push: function(items, $cb) {

                this.getQueue().push(items, $cb);

            },
    
            pause: function($cb) {

                console.log('pause');

                this.getQueue().pause($cb);

            },
    
            resume: function($cb) {

                console.log('resume');

                this.getQueue().resume($cb);

            },

            end: function(method, $cb) {
                var ret = this.$super(method, $cb);

                if (this.getFlow().length === 0)
                    this.getQueue().clear();

                return ret;

            },

            endAll: function($cb) {
                var ret = this.$super($cb);

                this.getQueue().clear();

                return ret;
            }

        });
    }

});