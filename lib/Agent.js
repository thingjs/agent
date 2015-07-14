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
    },

    /**
     * @memberOf $thing
     */
    'Properties.get': function($cb) {
        var data = {},
            name = this.getName()
            ;

        if (name !== undefined)
            for (var prop in this.$properties)
                data[name + '#' + prop] = this[prop];

        this.getChildren().forEach(function(obj) {

            var name = obj.getName();

            if (obj.isAbstract() || name === undefined) return;

            for (var prop in obj.$properties)
                data[name + '#' + prop] = obj[prop];

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
            map = {},
            raisedError = false
            ;

        for (prop in data) {

            if ((offset = prop.lastIndexOf('#')) === -1)
                return $cb('onError', new Error('Property \'' + prop + '\' is malformed'))();

            propPrefix = prop.slice(0, offset);
            propName = prop.slice(offset + 1);

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

        if (interfaceName !== undefined || Object.keys(this.$properties).length > 0) {

            if (typeof map[interfaceName] === 'undefined')
                return $cb('onError', new Error('Missing properties'))();

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
                    return $cb(
                        'onError', 
                        new Error('Missing property \'' + interfaceName + '#' +prop + '\'')
                    )();
                else if (!isWritable && typeof map[interfaceName][prop] === 'object')
                    return $cb(
                        'onError', 
                        new Error(
                            'Property \'' + interfaceName + '#' + prop + '\' is not writable'
                        )
                    )();

            }

        }

        this.getChildren().forEach(function(obj) {

            interfaceName = obj.getName();
            
            if (raisedError ||
                interfaceName === undefined || 
                obj.isAbstract() ||
                Object.keys(obj.$properties).length === 0
            ) 
                return;

            if (typeof map[interfaceName] === 'undefined') {
                
                raisedError = true;

                return $cb('onError', new Error('Missing properties'))();

            }

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
                else if (isWritable && typeof map[interfaceName][prop] === 'undefined') {
                    
                    raisedError = true;

                    return $cb(
                        'onError',
                        new Error('Missing property \'' + interfaceName + '#' + prop + '\'')
                    )();

                }
                else if (!isWritable && typeof map[interfaceName][prop] === 'object') {

                    raisedError = true;

                    return $cb(
                        'onError',
                        new Error(
                            'Property \'' + interfaceName + '#' + prop + '\' is not writable'
                        )
                    )();

                }

            }

        });

        if (raisedError) return;

        for (var k in map)
            for (var l in map[k])
                if (map[k][l].obj === undefined)
                    return $cb(
                        'onError',
                        new Error('Undefined property \'' + k + '#' + l + '\'')
                    )();

        for (var n in map)
            for (var o in map[n])
                map[n][o].obj[o] = map[n][o].value;

        $cb('onComplete')();

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
            map = {},
            raisedError = false
            ;

        for (prop in data) {

            if ((offset = prop.lastIndexOf('#')) === -1)
                return $cb('onError', new Error('Property \'' + prop + '\' is malformed'))();

            propPrefix = prop.slice(0, offset);
            propName = prop.slice(offset + 1);

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

        if (interfaceName !== undefined || Object.keys(this.$properties).length > 0) {

            if (typeof map[interfaceName] === 'object')
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
                        return $cb(
                            'onError', 
                            new Error(
                                'Property \'' + interfaceName + '#' +prop + '\' is not writable'
                            )
                        )();

                }

        }

        this.getChildren().forEach(function(obj) {

            interfaceName = obj.getName();
            
            if (raisedError ||
                interfaceName === undefined ||
                obj.isAbstract() ||
                Object.keys(obj.$properties).length === 0
            ) 
                return;

            if (typeof map[interfaceName] === 'object')
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
                    else if (!isWritable && typeof map[interfaceName][prop] === 'object') {

                        raisedError = true;

                        return $cb(
                            'onError',
                            new Error(
                                'Property \'' + interfaceName + '#' + prop + '\' is not writable'
                            )
                        )();

                    }

                }

        });

        if (raisedError) return;

        for (var k in map)
            for (var l in map[k])
                if (map[k][l].obj === undefined) {

                    return $cb(
                        'onError',
                        new Error('Undefined property \'' + k + '#' + l + '\'')
                    )();

                }

        for (var n in map)
            for (var o in map[n])
                map[n][o].obj[o] = map[n][o].value;

        $cb('onComplete')();

    },

    /**
     * @memberOf $thing
     */
    'Description.get': function($cb) {
        var name,
            propDesc,
            prefix = this.getName(),
            data = {
                '@meta': {},
                '@properties': {},
                '@actions': {},
                '@events': {}
            }
            ;

        if (prefix !== undefined) {
            
            for (var prop in this.$properties) {

                propDesc = this.$properties[prop];

                name = prefix + '#' + prop;

                data['@properties'][name] = {};

                if (typeof propDesc.type === 'string')
                    data['@properties'][name].type = propDesc.type;

                data['@properties'][name].writable = (
                    typeof propDesc.set === 'function' ||
                    (typeof propDesc.writable === 'boolean' && propDesc.writable === true)
                )   
                    ? true
                    : false
                    ;

            }

            for (name in $thing.KnownMeta)
                $thing.searchMeta(this, name, $thing.KnownMeta[name], function() {

                    if (typeof data['@meta'][name] === 'undefined')
                        data['@meta'][name] = $thing.arrayDup(arguments);
                    else
                        data['@meta'][name] = data['@meta'][name].concat(
                            $thing.arrayDup(arguments)
                        );
                
                });

        }

        this.getChildren().forEach(function(obj) {

            var prefix = obj.getName(),
                interfaces = obj.getInterfaces()
                ;

            if (obj.isAbstract() || prefix === undefined) return;

            for (var prop in obj.$properties) {

                propDesc = obj.$properties[prop];

                name = prefix + '#' + prop;

                data['@properties'][name] = {};

                if (typeof propDesc.type === 'string')
                    data['@properties'][name].type = propDesc.type;

                data['@properties'][name].writable = (
                    typeof propDesc.set === 'function' ||
                    (typeof propDesc.writable === 'boolean' && propDesc.writable === true)
                )   
                    ? true
                    : false
                    ;

            }

            if (interfaces.indexOf('Action') > -1) {

                var actionDesc = {
                    '@meta': {}
                };

                for (var name in $thing.KnownMeta)
                    $thing.searchMeta(obj, name, $thing.KnownMeta[name], function() {

                        if (typeof actionDesc['@meta'][name] === 'undefined')
                            actionDesc['@meta'][name] = $thing.arrayDup(arguments);
                        else
                            actionDesc['@meta'][name] = actionDesc['@meta'][name].concat(
                                $thing.arrayDup(arguments)
                            );
                
                    });

                data['@actions'][prefix] = actionDesc;

            }
            
            if (interfaces.indexOf('Event') > -1) {

                var eventDesc = {
                    '@meta': {}
                };

                for (var name in $thing.KnownMeta)
                    $thing.searchMeta(obj, name, $thing.KnownMeta[name], function() {

                        if (typeof eventDesc['@meta'][name] === 'undefined')
                            eventDesc['@meta'][name] = $thing.arrayDup(arguments);
                        else
                            eventDesc['@meta'][name] = eventDesc['@meta'][name].concat(
                                $thing.arrayDup(arguments)
                            );
                
                    });

                data['@events'][prefix] = eventDesc;

            }

        });

        $cb('data', data)();

    }

});
