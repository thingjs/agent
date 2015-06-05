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
 * @class Agent
 * @mixes $thing.Delegate
 * @memberOf $thing
 */
$thing.Agent = $thing.Delegate.inherit({

    getName: function() {
        return 'Agent';
    },

    getInterfaces: function() {
        return ['Agent'];
    },

    /**
     * @memberOf $thing
     * @method Agent#setup
     */
    setup: function(cb) {
        this.setState($thing.State.LIFE_ACTIVE);
        this.doActivate(cb);
    },

    /**
     * @memberOf $thing
     * @method Agent#takedown
     */
    takedown: function(cb) {
        this.doDelete(cb);
    },

    /**
     * @memberOf $thing
     * @method Agent#doActivate
     */
    doActivate: function(cb) {
        this.unsetState($thing.State.LIFE_SUSPENDED);
        if (cb) cb();
    },

    /**
     * @memberOf $thing
     * @method Agent#doDelete
     */
    doDelete: function(cb) {
        this.setState($thing.State.LIFE_DELETED);
        if (cb) cb();
    },

    /**
     * @memberOf $thing
     * @method Agent#doSuspend
     */
    doSuspend: function(cb) {
        this.setState($thing.State.LIFE_SUSPENDED);
        if (cb) cb();
    },

    /**
     * @memberOf $thing
     * @method Agent#doWait
     */
    doWait: function(cb) {
        this.setState($thing.State.LIFE_WAITING);
        if (cb) cb();
    },

    /**
     * @memberOf $thing
     * @method Agent#doWake
     */
    doWake: function(cb) {
        this.unsetState($thing.State.LIFE_WAITING);
        if (cb) cb();
    },

    /**
     * @memberOf $thing
     * @method Agent#addBehaviour
     * @param {*}
     * @returns {$thing.Behaviour}
     */
    addBehaviour: function() {
        var obj,
            reset,
            self = this,
            threadId = $thing.getThreadId(1),
            args = $thing.arrayDup(arguments),
            def = new $thing.Definition(
                this,
                $thing.Behaviour,
                threadId,
                args
            )
            ;

        if (def.class !== undefined) {
            var funct = function() {

                (!def.refCount)
                    ? def.refObject(function(instance, cbRelease) {
                        $thing.attach(def);
                        obj = instance;
                        self.getChildren().push(obj, cbRelease);
                    })
                    : obj = def.instance
                    ;
                    
                obj.unsetState(
                    $thing.State.LIFE_WAITING |
                    $thing.State.LIFE_SUSPENDED |
                    $thing.State.LIFE_DELETED |
                    $thing.State.LIFE_TRANSIT |
                    $thing.State.LIFE_BLOCKED
                );
                
                obj.setState(self.getState() | $thing.State.LIFE_ACTIVE);
                
            };
            
            funct();
            
            reset = obj.reset;
            
            obj.reset = function() {
                funct();
                reset.apply(obj, arguments);
            };

            $thing.async.setImmediate(function() {
                $thing.Tasker.thread(threadId);
            });
            
        }
        
        return obj;
    },

    /**
     * @memberOf $thing
     * @method Agent#removeBehaviour
     * @param {string|$thing.Behaviour}
     */
    removeBehaviour: function() {
        var objs = [],
            children = this.getChildren()
            ;
            
        if (typeof arguments[0] === 'object' &&
            arguments[0].getHeapId !== undefined
        ) {
            var id = arguments[0].getHeapId();
            
            children.forEach(function(obj, cbRelease) {
                if (obj.getHeapId() === id) {
                    obj.setState($thing.State.LIFE_DELETED);
                    cbRelease();
                    objs.push(obj);
                }
            });
        }
        else {
            var args = $thing.arrayDup(arguments),
                def = new $thing.Definition(
                    this,
                    $thing.Behaviour,
                    $thing.getThreadId(1),
                    args
                )
                ;
                
            children.forEach(function(obj, cbRelease) {
                if (obj.getName() === def.name) {
                    obj.setState($thing.State.LIFE_DELETED);
                    cbRelease();
                    objs.push(obj);
                }
            });
        }

        return objs;
    }

});
