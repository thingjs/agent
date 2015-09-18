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
        return [
            'Agent',
            'Description',
            'Properties'
        ];
    },

    /**
     * @memberOf $thing
     * @method Agent#setup
     */
    setup: function(cb) {
        var meta,
            name = this.getName()
            ;

        if (this.$ontology !== undefined && name !== undefined && name.indexOf(':') > -1) {
        
            $thing.merge(this.$ontology, $thing.Wot['@context']);

            for (var prop in this.$properties)
                if ((meta = $thing.objectDupMeta(this.$properties[prop])))
                    this.$ontology[this.$id + ':' + prop] = meta;

            this.$ontology[this.$id] = name;

        }

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
            name,
            meta,
            reset,
            self = this,
            threadId = $thing.getThreadId(1, this.getThreadId()[1]),
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

            if (this.$ontology !== undefined) {

                name = obj.getName();

                if (name !== undefined && name.indexOf(':') > -1) {

                    $thing.merge(obj.$ontology, $thing.Wot['@context']);

                    for (var prop in obj.$properties)
                        if ((meta = $thing.objectDupMeta(obj.$properties[prop])))
                            obj.$ontology[obj.$id + ':' + prop] = meta;

                    obj.$ontology[obj.$id] = name;
            
                }

                obj.$ontology = $thing.merge(this.$ontology, obj.$ontology);

            }

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
            
        if (typeof arguments[0] === 'object' && arguments[0].getHeapId !== undefined) {

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

        for (var k in objs)
            for (var j in this.$ontology)
                if (j.indexOf(objs[k].$id + ':') === 0)
                    delete this.$ontology[j];

        return objs;
    },

    /**
     * @memberOf $thing
     */
    'Properties.get': function($cb) {
        var data = { '@context': this.$ontology },
            name = this.getName()
            ;

        if (name !== undefined && name.indexOf(':') > -1)
            for (var prop in this.$properties)
                data[this.$id + ':' + prop] = this[prop];

        this.getChildren().forEach(function(obj) {

            name = obj.getName();

            if (obj.isAbstract() || name === undefined || name.indexOf(':') < 0) 
                return;

            for (var prop in obj.$properties)
                data[obj.$id + ':' + prop] = obj[prop];

        });

        $cb('data', data)();

    },

    /**
     * @memberOf $thing
     */
    'Properties.put': function(data, $cb) {
        var prop,
            offset,
            propPrefix,
            propName,
            propDesc,
            interfaceName,
            isWritable,
            map = {}
            ;

        for (prop in data) {

            if (typeof data[prop] === 'object' && typeof data[prop]['@type'] !== 'undefined')
                throw new Error(
                    'Type \'' + data[prop]['@type'] + '\' mismatch for property \'' + prop + '\''
                );

            if ((offset = prop.lastIndexOf(':')) === -1)
                throw new Error('Undefined property \'' + prop + '\'');

            propPrefix = this.$ontology[prop.slice(0, offset)];
            propName = prop.slice(offset + 1);

            if (propPrefix === undefined || propName === undefined)
                throw new Error('Undefined property \'' + prop + '\'');

            if (typeof map[propPrefix] === 'object')
                map[propPrefix][propName] = {
                    value: data[prop],
                    obj: undefined
                };
            else {
                map[propPrefix] = {};
                map[propPrefix][propName] = {
                    value: data[prop],
                    obj: undefined
                };
            }

        }

        interfaceName = this.getName();

        if (interfaceName !== undefined && Object.keys(this.$properties).length > 0) {

            if (typeof map[interfaceName] === 'undefined')
                throw new Error('Missing properties');

            for (prop in this.$properties) {

                propDesc = this.$properties[prop];

                isWritable = (
                    typeof propDesc.set === 'function' ||
                    (typeof propDesc.writable === 'boolean' && propDesc.writable === true)
                )
                    ? true
                    : false
                    ;
                
                if (isWritable && typeof map[interfaceName][prop] === 'object')
                    map[interfaceName][prop].obj = this;
                else if (isWritable && typeof map[interfaceName][prop] === 'undefined')
                    throw new Error('Missing property \'' + interfaceName + prop + '\'');
                else if (!isWritable && typeof map[interfaceName][prop] === 'object')
                    throw new Error('Property \'' + interfaceName + prop + '\' is not writable');

            }

        }

        this.getChildren().forEach(function(obj) {

            interfaceName = obj.getName();
            
            if (interfaceName === undefined ||
                obj.isAbstract() ||
                interfaceName.indexOf(':') === -1 ||
                Object.keys(obj.$properties).length === 0
            ) 
                return;

            if (typeof map[interfaceName] === 'undefined')
                throw new Error('Missing properties');

            for (var prop in obj.$properties) {

                propDesc = obj.$properties[prop];

                isWritable = (
                    typeof propDesc.set === 'function' ||
                    (typeof propDesc.writable === 'boolean' && propDesc.writable === true)
                )
                    ? true
                    : false
                    ;
                
                if (isWritable && typeof map[interfaceName][prop] === 'object')
                    map[interfaceName][prop].obj = obj;
                else if (isWritable && typeof map[interfaceName][prop] === 'undefined')
                    throw new Error('Missing property \'' + interfaceName + prop + '\'');
                else if (!isWritable && typeof map[interfaceName][prop] === 'object')
                    throw new Error('Property \'' + interfaceName + prop + '\' is not writable');

            }

        });

        for (var k in map)
            for (var l in map[k])
                if (map[k][l].obj === undefined)
                    throw new Error('Undefined property \'' + k + l + '\'');

        for (var n in map)
            for (var o in map[n])
                map[n][o].obj[o] = map[n][o].value;

        $cb('complete')();

    },

    /**
     * @memberOf $thing
     */
    'Properties.patch': function(data, $cb) {
        var prop,
            offset,
            propPrefix,
            propName,
            propDesc,
            interfaceName,
            isWritable,
            map = {}
            ;

        for (prop in data) {

            if (typeof data[prop] === 'object' && typeof data[prop]['@type'] !== 'undefined')
                throw new Error(
                    'Type \'' + data[prop]['@type'] + '\' mismatch for property \'' + prop + '\''
                );

            if ((offset = prop.lastIndexOf(':')) === -1)
                throw new Error('Undefined property \'' + prop + '\'');

            propPrefix = this.$ontology[prop.slice(0, offset)];
            propName = prop.slice(offset + 1);

            if (propPrefix === undefined || propName === undefined)
                throw new Error('Undefined property \'' + prop + '\'');

            if (typeof map[propPrefix] === 'object')
                map[propPrefix][propName] = {
                    value: data[prop],
                    obj: undefined
                };
            else {
                map[propPrefix] = {};
                map[propPrefix][propName] = {
                    value: data[prop],
                    obj: undefined
                };
            }

        }

        interfaceName = this.getName();

        if (interfaceName !== undefined && 
            typeof map[interfaceName] !== 'undefined' &&
            Object.keys(this.$properties).length > 0
        ) {

            for (prop in this.$properties) {

                propDesc = this.$properties[prop];

                isWritable = (
                    typeof propDesc.set === 'function' ||
                    (typeof propDesc.writable === 'boolean' && propDesc.writable === true)
                )
                    ? true
                    : false
                    ;
                
                if (isWritable && typeof map[interfaceName][prop] === 'object')
                    map[interfaceName][prop].obj = this;
                else if (!isWritable && typeof map[interfaceName][prop] === 'object')
                    throw new Error('Property \'' + interfaceName + prop + '\' is not writable');

            }

        }

        this.getChildren().forEach(function(obj) {

            interfaceName = obj.getName();
            
            if (interfaceName === undefined ||
                obj.isAbstract() ||
                interfaceName.indexOf(':') === -1 ||
                typeof map[interfaceName] === 'undefined' ||
                Object.keys(obj.$properties).length === 0
            ) 
                return;

            for (var prop in obj.$properties) {

                propDesc = obj.$properties[prop];

                isWritable = (
                    typeof propDesc.set === 'function' ||
                    (typeof propDesc.writable === 'boolean' && propDesc.writable === true)
                )
                    ? true
                    : false
                    ;
                
                if (isWritable && typeof map[interfaceName][prop] === 'object')
                    map[interfaceName][prop].obj = obj;
                else if (!isWritable && typeof map[interfaceName][prop] === 'object')
                    throw new Error('Property \'' + interfaceName + prop + '\' is not writable');

            }

        });

        for (var k in map)
            for (var l in map[k])
                if (map[k][l].obj === undefined)
                    throw new Error('Undefined property \'' + k + l + '\'');

        for (var n in map)
            for (var o in map[n])
                map[n][o].obj[o] = map[n][o].value;

        $cb('complete')();

    },

    /**
     * @memberOf $thing
     */
    'Description.get': function($cb) {
        var propDesc,
            name = this.getName(),
            data = {
                '@context': $thing.objectDup(this.$ontology),
                '@id': this.$id + ':agent',
                '@type': 'wot:thing',
                '@graph': [],
            },
            context = data['@context'],
            graph = data['@graph']
            ;

        if (name !== undefined && name.indexOf(':') > -1) {
            
            var cbAgentMeta = function() {
                
                    if (typeof data['wot:' + name] === 'undefined')
                        data['wot:' + name] = $thing.arrayDup(arguments);
                    else
                        data['wot:' + name] = data['wot:' + name].concat(
                            $thing.arrayDup(arguments)
                        );

                }
                ;

            for (var prop in this.$properties) {

                propDesc = {
                    '@id': this.$id + ':' + prop,
                    '@type': 'wot:property'
                };

                propDesc['wot:writable'] = (
                    typeof this.$properties[prop].set === 'function' ||
                    (   typeof this.$properties[prop].writable === 'boolean' && 
                        this.$properties[prop].writable === true
                    )
                )   
                    ? true
                    : false
                    ;

                prop = propDesc['@id'];

                if (typeof context[prop] === 'object')
                    if (typeof context[prop]['@type'] === 'undefined') delete context[prop];
                    else {

                        propDesc['@type'] = context[prop]['@type'];

                        delete context[prop];

                    }

                graph.push(propDesc);

            }

            for (name in $thing.Wot.meta)
                $thing.searchMeta(this, name, $thing.Wot.meta[name], cbAgentMeta);

        }

        this.getChildren().forEach(function(obj) {

            var meta,
                name = obj.getName(),
                interfaces = obj.getInterfaces()
                ;

            if (obj.isAbstract() || name === undefined || name.indexOf(':') === -1) return;

            for (var prop in obj.$properties) {

                propDesc = {
                    '@id': obj.$id + ':' + prop,
                    '@type': 'wot:property'
                };

                propDesc['wot:writable'] = (
                    typeof obj.$properties[prop].set === 'function' ||
                    (   typeof obj.$properties[prop].writable === 'boolean' && 
                        obj.$properties[prop].writable === true
                    )
                )   
                    ? true
                    : false
                    ;

                prop = propDesc['@id'];

                if (typeof context[prop] === 'object')
                    if (typeof context[prop]['@type'] === 'undefined') delete context[prop];
                    else {

                        propDesc['@type'] = context[prop]['@type'];

                        delete context[prop];

                    }

                graph.push(propDesc);

            }

            if (interfaces.indexOf('Action') > -1) {

                var actionDesc = {
                        '@id': obj.$id + ':behaviour',
                        '@type': 'wot:action'
                    },
                    cbActionMeta = function() {

                        if (typeof actionDesc['wot:' + meta] === 'undefined')
                            actionDesc['wot:' + meta] = $thing.arrayDup(arguments);
                        else
                            actionDesc['wot:' + meta] = 
                                actionDesc['wot:' + meta].concat($thing.arrayDup(arguments));
                
                    }
                    ;

                for (meta in $thing.Wot.meta)
                    $thing.searchMeta(obj, meta, $thing.Wot.meta[meta], cbActionMeta);

                graph.push(actionDesc);

            }
            
            if (interfaces.indexOf('Event') > -1) {

                var eventDesc = {
                        '@id': obj.$id + ':behaviour',
                        '@type': 'wot:event'
                    },
                    cbEventMeta = function() {

                        if (typeof eventDesc['wot:' + meta] === 'undefined')
                            eventDesc['wot:' + meta] = $thing.arrayDup(arguments);
                        else
                            eventDesc['wot:' + meta] = 
                                eventDesc['wot:' + meta].concat($thing.arrayDup(arguments));
                
                    }
                    ;

                for (meta in $thing.Wot.meta)
                    $thing.searchMeta(obj, meta, $thing.Wot.meta[meta], cbEventMeta);

                graph.push(eventDesc);

            }

        });

        $cb('data', data)();

    }

});
