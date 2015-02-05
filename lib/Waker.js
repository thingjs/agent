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

$thing.WAKE_MIN_PERIOD = 50000;

$thing.agent('@singleton', {
    
    setup: function(cb) {
        this.$super(cb);
    
        /**
         * @class Waker
         * @mixes Behaviour
         * @abstract
         */
        this.addBehaviour('abstract Waker', {

            /**
             * @method Waker#getWakeTime
             */
            getWakeTime: function() {
                var time,
                    period = 1000000,
                    now = $thing.getMicroTime()
                    ;

                $thing.searchMeta(this, 'period', 'int', function(value) {
                    period = value * 1000;
                });

                time = now + period - (now % period);

                this.getWakeTime = function() {
                    return time;
                };
                        
                return this.getWakeTime();
            },

            /**
             * @method Waker#wake
             */
            wake: function(cb) {
                cb();
            },

            action: function($cb) {
                var time = this.getWakeTime();

                if (time === undefined) 
                    return this.$super($cb);
                else if ($thing.getMicroTime() >= time) {
                    this.getWakeTime = function() {
                        return undefined;
                    };
                    
                    return this.wake(
                        this.bind(function() {
                            this.$super($cb);
                        })
                    );
                }

                this.$super($cb);
            },

            done: function() {
                if (this.getWakeTime() !== undefined)
                    return false;
                else {
                    delete this.getWakeTime;
                    return true;
                }
            },

            reset: function($cb) {
                delete this.getWakeTime;
                this.$super($cb);
            },

            /**
             * @method Waker#stop
             */
            stop: function($cb) {
                this.$owner.removeBehaviour(this);
                delete this.getWakeTime;
                if ($cb) $cb();
            }
 
        });
    }

});