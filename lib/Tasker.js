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
 * @class Tasker
 * @mixes $thing.Base
 * @memberOf $thing
 */
$thing.Tasker = new ($thing.Base.inherit({

    doWake: function(container) {
        var now = $thing.getMicroTime();

        if (!container.nextWakeTime || now >= container.nextWakeTime) {

            var selector = new $thing.Selector(
                    container,
                    [['Behaviour', 'and', 'Waker']], 
                    ['container:0:0', '$thing'], 
                    false
                )
                ;

            if (selector.length === 0) {
                selector.release();
                selector = undefined;
            }
            else {
                selector.dispatch(
                    {   filters: $thing.Filter.ALL,
                        method: 'action',
                        args: []
                    },
                    function(cbNext) {
                        cbNext();
                    },
                    function() {
                        selector.release();
                        selector = undefined;
                    }
                );
            }

            container.nextWakeTime =   
                now + $thing.WAKE_MIN_PERIOD - (now % $thing.WAKE_MIN_PERIOD);
        }

    },

    doAction: function(container) {
        var self = this;

        if (container.isActionTaskQueued) return;
        container.isActionTaskQueued = true;

        $thing.async.setImmediate(function() {
            var selector = new $thing.Selector(
                    container,
                    [['Behaviour', 'not', 'Waker']], 
                    ['container:0:0', '$thing'], 
                    false
                )
                ;
        
            if (selector.length === 0) {
                selector.release();
                selector = undefined;
                container.isActionTaskQueued = false;
            }
            else {
                selector.dispatch(
                    {   filters: $thing.Filter.ALL,
                        method: 'action',
                        args: []
                    },
                    function(cbNext) {
                        cbNext();
                    },
                    function() {
                        selector.release();
                        selector = undefined;
                        container.isActionTaskQueued = false;
                        self.doAction(container);
                    }
                );
            }

        });

    },

    thread: function() {
        var container = $thing.getContainer($thing.getBacktrace());

        this.doWake(container);
        this.doAction(container);
    }
    
}))();