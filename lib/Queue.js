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
                var self = this,
                    concurrency = 1,
                    limit = 0,
                    functs = [],
                    active = 0,
                    paused = false
                    ;

                $thing.searchMeta(this, 'concurrency', 'int', function(value) {
                    concurrency = value;
                });
            
                $thing.searchMeta(this, 'limit', 'int', function(value) {
                    limit = value;
                });
            
                var queue = {
                
                    push: function(item, cbItem) {
                    
                        if (limit && functs.length > limit - 1) {
                            cbItem(-1);
                            return;
                        }
                    
                        if (!paused)
                            self.unsetState($thing.State.LIFE_WAITING);
                    
                        functs.push(function(cbDone) {
                            var flow = self.getFlow();
                        
                            if (!flow.length) {
                                cbDone();
                                cbItem(-1);
                            }
                            else {
                                $thing.async.applyEach(
                                    flow,
                                    item,
                                    function(err) {
                                        cbDone();
                                        cbItem(err);
                                    }
                                );
                            }
                    
                        });
                
                    },
                
                    action: function(next, cb) {
                        var call = [],
                            length = (functs.length < concurrency)
                                ? functs.length
                                : concurrency
                                ;
                    
                        while(length--)
                            call.push(functs.shift());
                        
                        if (call.length > 0) {
                            active = call.length;
                            
                            $thing.async.parallel(call, function() {
                                active = 0; 
                                next(cb);
                            });
                        }
                        else {
                            self.setState($thing.State.LIFE_WAITING);
                            next(cb);
                        }
                    },
                
                    pause: function() {
                        if (!paused) {
                            paused = true;
                            self.setState($thing.State.LIFE_WAITING);
                        }
                    },
                
                    resume: function() {
                        if (paused) {
                            paused = false;
                            self.unsetState($thing.State.LIFE_WAITING);
                            $thing.agent();
                        }
                    }   
        
                };
        
                Object.defineProperty(queue, 'length', {
                    get: function() {
                        return active + functs.length;
                    }
                });
        
                this.getQueue = function() {
                    return queue;
                };
        
                return queue;
            },
    
            action: function($cb) {
                this.getQueue().action(this.bind(this.$super), $cb);
            },
    
            /**
             * @method Queue#push
             */
            push: function(items, $cb) {
                if (items instanceof Array) {
                    var self = this,
                        length = items.length,
                        errs = [],
                        ret
                        ;
            
                    items.forEach(function(item, i) {
                        self.getQueue().push(item, function(err) {
                            ret = (errs[i] = err) || ret;
                    
                            if (!--length)
                                (ret)
                                    ? $cb('doneWithError', errs)()
                                    : $cb('done')()
                                    ;            
                        });
                    });
                }
                else {
                    this.getQueue().push(items, function(err) {
                        (err)
                            ? $cb('doneWithError', err)()
                            : $cb('done')()
                            ;
                    });
                }
        
                $thing.agent();
            },
    
            pause: function($cb) {
                this.getQueue().pause();
                $cb();
            },
    
            resume: function($cb) {
                this.getQueue().resume();
                $cb();
            }

        });
    }

});