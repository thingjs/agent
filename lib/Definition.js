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

$thing.BURST_DECAY =  5 * 60 * 1000000;

$thing.State = {
    EXPR_AND:       1,
    EXPR_NOT:       2,
    EXPR_OR:        3,
    DEF_DESC:       1,
    DEF_NAME:       2,
    DEF_SOURCE:     4,
    DEF_EXTENDS:    16,
    DEF_IMPLEMENTS: 64,
    DEF_USES:       128,
    DEF_META:       256,
    DEF_NOP:        512,
    DEF_END:        1024,
    LIFE_INITIATED: 2048,
    LIFE_ACTIVE:    4096,
    LIFE_WAITING:   8192,
    LIFE_SUSPENDED: 16384,
    LIFE_DELETED:   32768,
    LIFE_TRANSIT:   65536,
    LIFE_BLOCKED:   131072
};

$thing.Definition = $thing.Base.inherit({

    $metaHandlers: {

        mobile: function() {
            this._isMobile = true;
        },

        passive: function() {
            this._isPassive = true;
        },

        singleton: function() {
            this._singleton = this._singleton || this._source;
        },

        catchall: function(catchall, methodName) {
            this._substitute.$__catchall__ = methodName;
        }

    },

    getName: function() {
        return 'Definition';
    },

    /**
     * @constructs Definition
     * @mixes $thing.Base
     * @memberOf $thing
     * @param {object} parent
     * @param {object} super
     * @param {string[]} threadId
     * @param {string[]} stack
     */
    init: function(parent, _super, threadId, stack) {
        var k,
            item,
            search,
            self = this,
            heap = $thing.getContainer(threadId).heap
            ;

        this.$super();
        
        this._state = $thing.State.DEF_DESC;
        this._threadId = threadId;
        this._parent = parent;
        this._children = [];
        this._meta = [];
        this._interfaces = [];
        this._uses = [];
        this._super = _super;
        this._source = threadId[0];
        this._refCount = 0;
        this._isAgent = this._super === $thing.Agent;
        this._isAbstract = false;
        this._isPassive = false;
        this._isMobile = false;

        this._lastBurstTime = 0;
        this._burstAverage = 1;

        this._waitTime = $thing.getMicroTime();

        this._interfaces = [
            $thing.create64BitId(this._source, heap.length),
            this._source
        ];

        this._substitute = {
            $id: this._interfaces[0],
            $source: this._source
        };
        
        this.parseStack(stack);
        
        if (this._extends !== undefined) {
            item = $thing.search({_name: this._extends}, heap);
            
            if (item === undefined) throw new Error(
                'DefinitionError: Super Class \'' +
                this._extends + '\' is not defined'
            );
            else {
                this._super = item._class;
                this._singleton = item._singleton;
                for(k = item._meta.length - 1; k > -1; k--)
                    this._meta.unshift(item._meta[k]);
            }
            
            (this._class === undefined)
                ? this._class = {}
                : undefined
                ;
        }
        
        this._meta.forEach(function(item) {
            var args = item.split(/ (.+)?/);
            
            (self.$metaHandlers[args[0]] !== undefined)
                ? self.$metaHandlers[args[0]].apply(self, args)
                : undefined
                ;
        });
        
        if (this._isAbstract)
            search = {
                _name: this._name,
                _source: this._source
            };
        else if (this._singleton !== undefined)
            search = {
                _name: this._name,
                _singleton: this._singleton
            };
        
        if (search !== undefined && (item = $thing.search(search, heap))) {
            this.refObject = item.bind(item.refObject);
            
            this.property('class', function() {
                return item._class;
            });
            
            this.property('refCount', function() {
                return item._refCount;
            });
            
            this.property('isAbstract', function() {
                return item._isAbstract;
            });
            
            this.property('isPassive', function() {
                return item._isPassive;
            });
                
            this.property('instance', function() {
                return item._instance;
            });
                
            this.property('state', function() {
                return item._state;
            });
                
            this.property('name', function() {
                return item._name;
            });

            this.property('parent', function() {
                return item._parent;
            });

            this.property('threadId', function() {
                return item._threadId;
            });

        }
        else {
            
            this._childrenWrapper = {
                push: this.bind(this._pushChild),
                forEach: this.bind(this._forEachChild)
            };
            
            Object.defineProperty(this._childrenWrapper, 'length', {
                get: this.bind(this._countChildren)
            });
            
            (this._factory !== undefined)
                ? this._class = this._factory.apply($thing, this._uses)
                : undefined
                ;
            
            if (this._class !== undefined) {
                for(k in this._substitute)
                    this._class[k] = this._substitute[k]
                    ;
                
                var interfaces = (this._name !== undefined)
                    ? this._interfaces.concat(this._name)
                    : this._interfaces
                    ;
                
                this._class.getInterfaces = function() {
                    return this.$super().concat(interfaces);
                };
                
                this._class = this._super.inherit(
                    this._class,
                    parent,
                    this._isMobile
                );
                
                $thing.attach(this, heap);
            }
            
            this.property('class', function() {
                return this._class;
            });
            
            this.property('refCount', function() {
                return this._refCount;
            });
            
            this.property('isAbstract', function() {
                return this._isAbstract;
            });
            
            this.property('isPassive', function() {
                return this._isPassive;
            });
            
            this.property('instance', function() {
                return this._instance;
            });
            
            this.property('state', function() {
                return this._state;
            });
            
            this.property('name', function() {
                return this._name;
            });
            
            this.property('parent', function() {
                return this._parent;
            });

            this.property('threadId', function() {
                return this._threadId;
            });

        }

    },

    _forEachChild: function(cb) {
        this._children.forEach(function(args) {
            (args[0].getHeapId !== undefined)
                ? cb.apply(undefined, args)
                : undefined
                ;
        });
    },

    _pushChild: function(obj) {
        var id = obj.getHeapId();
    
        for(var i = 0; i < this._children.length; i++) {

            if (this._children[i][0].getHeapId === undefined)
                this._children.splice(i, 1);

            else if (this._children[i][0].getHeapId() === id)
                return this._children.length;

        }
    
        return this._children.push(arguments);
    },

    _countChildren: function() {
        var length = 0;
        
        this._forEachChild(function(child) {
            if (child.getRefCount())
                length++;
        });
        
        return length;
    },

    parseStack: function(stack) {
        var item,
            match,
            self = this
            ;
        
        function replace() {
            return (arguments[1] === undefined)
                ? stack.shift()
                : self._substitute['$' + arguments[1]] = stack.shift()
                ;
        }
        
        while(  this._state !== $thing.State.DEF_END &&
                (item = stack.shift()) !== undefined
        ) {
        
            switch(typeof item) {
                case 'function':
                    this._state = $thing.State.DEF_END;
                    this._factory = item;
                    continue;

                case 'object':
                    this._state = $thing.State.DEF_END;
                    this._class = item;
                    continue;
            }
            
            switch(item) {
                case 'abstract':
                    this._isPassive = this._isAbstract = true;
                    continue;

                case 'source':
                    this._state = $thing.State.DEF_SOURCE;
                    continue;

                case 'extends':
                    this._state = $thing.State.DEF_EXTENDS;
                    continue;

                case 'implements':
                    this._state = $thing.State.DEF_IMPLEMENTS;
                    continue;

                case 'uses':
                    this._state = $thing.State.DEF_USES;
                    continue;

                default:
                    (this._state === $thing.State.DEF_META || item.charAt(0) === '@')
                        ? this._state = $thing.State.DEF_META
                        : (item.match(/ /))
                            ? this._state = $thing.State.DEF_DESC
                            : undefined
                            ;
            }
            
            switch(this._state) {

                case $thing.State.DEF_DESC:
                    item = item.replace(/\$\((.+?)\)|\$/g, replace);
                    
                    item = item.split(' @');

                    stack = item[0].split(/ +/).filter(Boolean).concat(
                        (item[1] !== undefined)
                            ? ['@' + item[1]].concat(stack)
                            : stack
                    );

                    (this._name === undefined)
                        ? this._state = $thing.State.DEF_NAME
                        : this._state = $thing.State.DEF_NOP
                        ;
                    break;
                    
                case $thing.State.DEF_META:
                    item = item.replace(/\$\((.+?)\)|\$/g, replace);
                    
                    if (item.charAt(item.length - 1) === '+') {
                        stack = [
                            item.slice(0, -1) + stack.shift()
                        ].concat(stack);
                    }
                    else {
                        this._state = $thing.State.DEF_DESC;
                        this._meta.push(item.slice(1));
                    }
                    
                    break;
                
                case $thing.State.DEF_NAME:
                    this._name = item || this._name;
                    break;
                
                case $thing.State.DEF_SOURCE:
                    this._source = item || this._source;
                    break;
                
                case $thing.State.DEF_EXTENDS:
                    this._extends = item || this._extends;
                    break;
                
                case $thing.State.DEF_IMPLEMENTS:
                    ((match = item.match(/^\/(.*?)\/([gimy]*)$/)) !== null)
                        ? this._interfaces.push(
                            new RegExp(match[1], match[2])
                        )
                        : this._interfaces.push(item)
                        ;
                    break;
                
                case $thing.State.DEF_USES:
                    this._uses.push($thing.agent(item));
                    break;
            }
        }
    },

    patchObject: function(obj) {
        var self = this;
        
        obj.refObject = this.bind(this.refObject);
        
        obj.getRefCount = function() {
            return self._refCount;
        };
        
        obj.getHeapId = function() {
            return self._id;
        };
        
        obj.getName = function() {
            return self._name;
        };
        
        obj.getSource = function() {
            return self._source;
        };
        
        obj.getChildren = function() {
            return self._childrenWrapper;
        };
        
        obj.getState = function() {
            return self._state;
        };
        
        obj.setState = function() {
            
            for (var k in arguments)
                self._state |= arguments[k];

            var states = $thing.arrayDup(arguments);
            
            this.getChildren().forEach(function(child) {
                child.setState(states);
            });

        };
        
        obj.unsetState = function() {
            
            for (var k in arguments)
                self._state  &= ~arguments[k];

            var states = $thing.arrayDup(arguments);

            this.getChildren().forEach(function(child) {
                child.unsetState(states);
            });
            
        };

        obj.getThreadId = function() {
            return $thing.arrayDup(self._threadId);
        };
        
        obj.getMeta = function() {
            return self._meta;
        };
        
        obj.isAbstract = function() {
            return self._isAbstract;
        };

        obj.waitTime = function() {
            self._waitTime = $thing.getMicroTime();
        };

        obj.burstTime = function(ticks) {
            var now = $thing.getMicroTime();

            if (!self._lastBurstTime)
                self._burstAverage = ticks;
            else {
                var a = 1 - (Math.exp(-(now - self._lastBurstTime) / $thing.BURST_DECAY * 60));

                self._burstAverage = a * ticks + (1 - a) * self._burstAverage;            
            }

            self._lastBurstTime = now;

            return self._burstAverage;
        };

        obj.getResponseRatio = function() {
            var now = $thing.getMicroTime();

            return (now - self._waitTime + self._burstAverage) / self._burstAverage;
        };
        
        return obj;
    },

    unpatchObject: function(obj) {
        
        delete obj.refObject;
        delete obj.getRefCount;
        delete obj.getHeapId;
        delete obj.getName;
        delete obj.getSource;
        delete obj.getChildren;
        delete obj.getState;
        delete obj.setState;
        delete obj.unsetState;
        delete obj.getThreadId;
        delete obj.getMeta;
        delete obj.isAbstract;
        delete obj.waitTime;
        delete obj.burstTime;
        delete obj.getResponseRatio;
        
        return obj;
    },

    refObject: function(cb) {
        var self = this;
        
        this.parent.refObject(function(parent, cbRelease) {

            if (self._refCount) self._refCount++;
            else {

                self._refCount = 1;
            
                self._instance = self.patchObject(new self._class());

                if (!self._isAbstract) {
                    
                    for (var prop in self._instance.$properties)
                        Object.defineProperty(
                            self._instance, 
                            prop, 
                            self._instance.$properties[prop]
                        );
                    
                    self._instance.setState($thing.State.LIFE_INITIATED);

                    if (self._isAgent) self._instance.setup();

                }

            }

            cb( self._instance,
                function() {

                    if (self._isAbstract) return;
                    else if (self._isAgent && self._isPassive) return;
                    else if (--self._refCount !== 0) cbRelease();
                    else {

                        if (self._isAgent)
                            self._instance.takedown(
                                function() {

                                    self._children = [];

                                    self.unpatchObject(self._instance);
                                    
                                    delete self._instance;
                                    
                                    cbRelease();

                                }
                            );
                        else {

                            self._children = [];

                            self.unpatchObject(self._instance);
                            
                            delete self._instance;
                            
                            cbRelease();

                        }

                    }

                }
            );

        });
    }

});