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
    LAST:           4
};

$thing.Selector = $thing.Base.inherit({

    getName: function() {
        return 'Selector';
    },

    /**
     * @constructs Selector
     * @mixes $thing.Base
     * @memberOf $thing
     * @param {object} container
     * @param {(string|string[]|$thing.Pattern)} pattern
     * @param {string[]} backtrace
     * @param {boolean} [includePassive=true]
     * @param {*[]} [heap=$thing.heap]
     */
    init: function(container, pattern, backtrace, includePassive) {
        var i,
            include,
            def,
            heap
            ;

        this.$super();

        this._exprs = [];
        this._selection = [];
        this._callbacks = [];
        this._backtrace = backtrace;
        this._source = this._backtrace !== undefined 
            ? this._backtrace[0] 
            : undefined
            ;
        
        if (pattern instanceof $thing.Pattern) {
            this._backtrace = pattern.backtrace;
            this._source = this._backtrace[0];
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
            for(i = 0; i < pattern.length; i++) {
                this.parseStack(pattern[i]);
            }
        }
        
        includePassive =
            (includePassive === undefined)
                ? true
                : includePassive
                ;
        
        heap = (container) 
            ? container.heap 
            : $thing.getContainer(this._backtrace).heap
            ;

        for(i = 0; i < heap.length; i++) {
            def = heap[i];
            
            include = (def.isPassive)
                ? (def.isPassive & includePassive) &&
                    def.state < $thing.State.LIFE_SUSPENDED
                : (includePassive)
                    ? def.state < $thing.State.LIFE_SUSPENDED
                    : def.state < $thing.State.LIFE_WAITING
                    ;

            if (!def.isAbstract &&
                def.refCount > 0 &&
                def.state & $thing.State.LIFE_ACTIVE &&
                include
            )
                def.refObject(this.bind(this.matchObject));

        }
        
        this.property('length', function() {
            return this._selection.length;
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

    dispatch: function(call, cbItem, cbDone) {
        $thing.async.setImmediate(this.bind(function() {

            if (call.filters & $thing.Filter.FIRST &&
                this._selection.length > 0
            ) {

                this._selection[0].obj.dispatch(
                    {   interface: this._selection[0].match,
                        method: call.method,
                        args: call.args
                    },
                    this.bind(function() {
                        return cbItem.apply(
                            this._selection[0].obj,
                            Array.prototype.slice.call(
                                arguments,
                                0
                            ).concat(cbDone)
                        );
                    })
                );

            }
            else if (   call.filters & $thing.Filter.LAST &&
                        this._selection.length > 0
            ) {
                var i = this._selection.length - 1;

                this._selection[i].obj.dispatch(
                    {   interface: this._selection[i].match,
                        method: call.method,
                        args: call.args
                    },
                    this.bind(function() {
                        return cbItem.apply(
                            this._selection[i].obj,
                            Array.prototype.slice.call(
                                arguments,
                                0
                            ).concat(cbDone)
                        );
                    })
                );
            }
            else if (   call.filters & $thing.Filter.ALL &&
                        this._selection.length > 0
            ) {

                $thing.async.each(
                    this._selection,
                    function(item, cbNext) {
                        item.obj.dispatch(
                            {   interface: item.match,
                                method: call.method,
                                args: call.args
                            },
                            function() {
                                return cbItem.apply(
                                    item.obj,
                                    Array.prototype.slice.call(
                                        arguments,
                                        0
                                    ).concat(cbNext)
                                );
                            }
                        );
                    },
                    cbDone
                );
            
            }
            else {

                cbDone();

            }

        }));
    },

    release: function() {
        for(var i = 0; i < this._callbacks.length; i++)
            this._callbacks[i]();
        this._callbacks = [];
        this._selection = [];
    }

});