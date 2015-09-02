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

$thing.Filter = {
    ALL:            1,
    FIRST:          2,
    LAST:           4,
    CLOSEST:        8
};

$thing.Selector = $thing.Base.inherit({

    getName: function() {
        return 'Selector';
    },

    /**
     * @constructs Selector
     * @mixes $thing.Base
     * @memberOf $thing
     * @param {[]} threadId
     * @param {(string|string[]|$thing.Pattern)} pattern
     * @param {boolean} [includePassive=true]
     */
    init: function(threadId, pattern, includePassive) {
        this.$super();

        this._threadId = threadId;
        this._includePassive = includePassive === undefined ? true : includePassive;
        this._exprs = [];
        this._schedule = [];
        this._selection = [];
        this._callbacks = [];

        this._filterStates = (this._includePassive) 
            ? $thing.State.LIFE_SUSPENDED
            : $thing.State.LIFE_WAITING
            ;
        
        if (pattern instanceof $thing.Pattern) {

            if (this._threadId === undefined)
                this._threadId = pattern.getThreadId();

            pattern = pattern.toArray();

        }
        else if (typeof pattern === 'string') {
            var expr = {
                and: {},
                not: {}
            };
            
            expr.and[pattern] = true;
            
            this._exprs.push(expr);

        }
        
        if (pattern instanceof Array) {
            for(var i = 0; i < pattern.length; i++) {
                this.parseStack(pattern[i]);
            }
        }

        this._container = $thing.getContainer(this._threadId);
        
        this.property('length', function() {

            return this._schedule.length;
        });

    },

    parseStack: function(stack) {
        var k,
            item,
            state = $thing.State.EXPR_AND,
            expr = {
                and: {},
                not: {}
            }
            ;
        
        while((item = stack.shift()) !== undefined) {
            
            switch(item) {
                case 'and':
                    state = $thing.State.EXPR_AND;
                    continue;
                
                case 'not':
                    state = $thing.State.EXPR_NOT;
                    continue;
                
                case 'or':
                    state = $thing.State.EXPR_OR;
                    continue;
            }

            switch(state) {
                case $thing.State.EXPR_AND:
                    expr.and[item] = true;
                    break;
                
                case $thing.State.EXPR_NOT:
                    expr.not[item] = true;
                    break;
                
                case $thing.State.EXPR_OR:
                    for (k in expr.and) {
                        this._exprs.push(expr);
                        break;
                    }
                    
                    expr = {
                        and: {},
                        not: {}
                    };
                    
                    expr.and[item] = true;
                    break;
            }
        }
        
        for (k in expr.and) {
            this._exprs.push(expr);
            break;
        }
    },

    matchObject: function(obj, cbRelease) {
        var k,
            match
            ;
        
        for (var i = 0; i < this._exprs.length; i++) {
            var m,
                expr = this._exprs[i]
                ;
            
            for(k in expr.and)
                if ((m = obj.matchInterface(k, this._source)) !== undefined)
                    match = match || m;
                else {
                    match = undefined;
                    break;
                }
                
            if (match === undefined)
                continue;
                
            for(k in expr.not)
                if (obj.matchInterface(k, this._source)) {
                    match = undefined;
                    cbRelease();
                    return;
                }

            if (match !== undefined)
                break;
        }
            
        if (match === undefined)
            cbRelease();
        else {
            this._callbacks.push(cbRelease);
            this._selection.push({match: match, obj: obj});
        }
    
    },

    select: function() {
        var i,
            j,
            include,
            def,
            heap
            ;

        this.release();

        heap = this._container.heap;

        for(i = 0; i < heap.length; i++) {
            def = heap[i];
            
            include = (def.isPassive)
                ? (def.isPassive & this._includePassive) && def.state < this._filterStates
                : def.state < this._filterStates
                ;

            if (!def.isAbstract &&
                def.refCount > 0 &&
                def.state & $thing.State.LIFE_ACTIVE &&
                include
            )
                def.refObject(this.bind(this.matchObject));
        }
        
        if (this._schedule.length !== this._selection.length) {
            
            this._schedule = new Array(this._selection.length);
    
            for (j = 0; j < this._schedule.length; j++)
                this._schedule[j] = j;

        }

    },

    schedule: function() {
        var obj;

        if (this._schedule.length === 1) {
            obj = this._selection[this._schedule[0]].obj; 

            if (typeof obj.getRefCount === 'undefined' || 
                obj.getState() >= this._filterStates
            )
                this._schedule.length = 0;

        }
        else {

            var shrink = false,
                self = this
                ;

            this._schedule.sort(function(x, y) {
                x = self._selection[x].obj;
                y = self._selection[y].obj;

                var xr = x.getResponseRatio(),
                    yr = y.getResponseRatio(),
                    xs = typeof x.getRefCount === 'function' && 
                        x.getState() < self._filterStates,
                    ys = typeof y.getRefCount === 'function' && 
                        y.getState() < self._filterStates               
                    ;

                if (!ys) {
                    shrink = true;
                    if (!xs) return 0; 
                    else return -1;
                }

                if (!xs) {
                    shrink = true;
                    return 1;
                }

                if (xr > yr) return -1;
                if (xr < yr) return 1;
    
                return 0;
            });

            if (shrink)
                for (var i = 0; i < this._schedule.length; i++) {
                    obj = this._selection[this._schedule[i]].obj; 

                    if (typeof obj.getRefCount === 'undefined' || 
                        obj.getState() >= this._filterStates
                    ) {
                        this._schedule.length = i; 
                        break;
                    }

                }
                
        }

    },

    dispatch: function(call, cbItem, cbDone) {
        var self = this,
            caller = this._container.audit[this._threadId[0]],
            outerTime = $thing.getMicroTime()
            ;

        caller.balance++;

        if (    (call.filters & $thing.Filter.ALL && this._schedule.length === 1) || 
                (call.filters & $thing.Filter.CLOSEST && this._schedule.length === 1) ||
                (call.filters & $thing.Filter.FIRST && this._schedule.length > 0)
        ) {

            var item = this._selection[this._schedule[0]],
                match = item.match,
                obj = item.obj,
                callee = this._container.audit[obj.getSource()],
                innerTime = $thing.getMicroTime()
                ;

            callee.balance++;

            obj.dispatch(
                {   interface: match,
                    method: call.method,
                    args: call.args
                },
                function() {

                    var now = $thing.getMicroTime(),
                        ticks = now - innerTime
                        ;

                    caller.balance--;
                    caller.ticks += now - outerTime;

                    callee.balance--;
                    callee.ticks += ticks;

                    caller.active = callee.active = now;

                    if (typeof obj.getRefCount === 'undefined')
                        obj = $thing.Container;
                    else {

                        obj.burstTime(ticks);

                        obj.waitTime();

                    }

                    return cbItem.apply(
                        obj,
                        $thing.arrayAppend(arguments, cbDone)
                    );
                }
            );

        }
        else if (   call.filters & $thing.Filter.LAST &&
                    this._schedule.length > 0
        ) {

            var item = this._selection[this._schedule[this._schedule.length - 1]],
                match = item.match,
                obj = item.obj,
                callee = this._container.audit[obj.getSource()],
                innerTime = $thing.getMicroTime()
                ;

            callee.balance++;

            obj.dispatch(
                {   interface: match,
                    method: call.method,
                    args: call.args
                },
                function() {
                    
                    var now = $thing.getMicroTime(),
                        ticks = now - innerTime
                        ;

                    caller.balance--;
                    caller.ticks += now - outerTime;

                    callee.balance--;
                    callee.ticks += ticks;

                    caller.active = callee.active = now;

                    if (typeof obj.getRefCount === 'undefined')
                        obj = $thing.Container;
                    else {

                        obj.burstTime(ticks);

                        obj.waitTime();

                    }

                    return cbItem.apply(
                        obj,
                        $thing.arrayAppend(arguments, cbDone)
                    );
                }
            );

        }
        else if (   call.filters & $thing.Filter.CLOSEST &&
                    this._schedule.length > 0
        ) {
        
            var obj,
                selection = $thing.arrayDup(this._selection),
                target = self._threadId[0]
                ;

            $thing.searchMeta(call.caller, 'target', function(value) {
                target = value;
            });

            selection.sort(function(x, y) {
                return $thing.xorDistance(target, x.obj.getThreadId()[0]) - 
                    $thing.xorDistance(target, y.obj.getThreadId()[0]);
            });

            obj = selection[0].obj;

            var callee = this._container.audit[obj.getSource()],
                innerTime = $thing.getMicroTime()
                ;

            callee.balance++;

            obj.dispatch(
                {   interface: selection[0].match,
                    method: call.method,
                    args: call.args
                },
                function() {

                    var now = $thing.getMicroTime(),
                        ticks = now - innerTime
                        ;

                    caller.balance--;
                    caller.ticks += outerTime - now;

                    callee.balance--;
                    callee.ticks += ticks;

                    caller.active = callee.active = now;

                    if (typeof obj.getRefCount === 'undefined')
                        obj = $thing.Container;
                    else {

                        obj.burstTime(ticks);

                        obj.waitTime();

                    }

                    return cbItem.apply(
                        obj,
                        $thing.arrayAppend(arguments, cbDone)
                    );
                }
            );

        }        
        else if (   call.filters & $thing.Filter.ALL &&
                    this._schedule.length > 0
        ) {

            $thing.async.each(
                this._schedule,
                function(item, cbNext) {
                    item = self._selection[item];

                    var match = item.match,
                        obj = item.obj,
                        callee = self._container.audit[obj.getSource()],
                        innerTime = $thing.getMicroTime()
                        ;

                    callee.balance++;

                    obj.dispatch(
                        {   interface: match,
                            method: call.method,
                            args: call.args
                        },
                        function() {

                            var now = $thing.getMicroTime(),
                                ticks = now - innerTime
                                ;

                            callee.balance--;
                            callee.ticks += ticks;

                            caller.ticks += now - outerTime;

                            caller.active = callee.active = now;

                            if (typeof obj.getRefCount === 'undefined')
                                obj = $thing.Container;
                            else {

                                obj.burstTime(ticks);

                                obj.waitTime();

                            }

                            return cbItem.apply(
                                obj,
                                $thing.arrayAppend(arguments, cbNext)
                            );
                        }
                    );

                },
                function() {

                    caller.balance--;
                    
                    cbDone();

                }
            );
            
        }
        else {

            cbDone();

        }

    },

    release: function() {
        var i,
            callbacks = this._callbacks
            ;

        this._schedule = [];
        this._callbacks = [];
        this._selection = [];

        for(i = 0; i < callbacks.length; i++) 
            callbacks[i]();
        
    }

});