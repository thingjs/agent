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

    doAction: function(container, selector, iteration) {
        var self = this;
        
        container.isTaskerQueued = true;

        if (iteration > selector.length) {
            selector.select();
            iteration = 0;
        }

        if (selector.length === 0) {
            selector.release();
            container.isTaskerQueued = false;
        }
        else {

            selector.schedule();

            selector.dispatch(
                {   filters: $thing.Filter.FIRST,
                    method: 'action',
                    args: []
                },
                function(cbNext) {
                    cbNext();
                },
                function() {

                    $thing.async.setImmediate(function() {
                        self.doAction(container, selector, ++iteration);
                    });
                
                }
            );

        }

    },

    thread: function(threadId) {
        if (threadId === undefined) 
            threadId = $thing.getThreadId(1);

        var container = $thing.getContainer(threadId);

        if (!container.isTaskerQueued) {

            var selector = new $thing.Selector(threadId, [['Behaviour']], false);

            selector.select();

            this.doAction(
                container,
                selector,
                0
            );
            
        }
        
    }
    
}))();