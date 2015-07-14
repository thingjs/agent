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
 * @memberOf $thing
 * @method switchContext
 */
$thing.switchContext = function(
    functString,
    parentOrdinal,
    superOrdinal,
    ordinal,
    superName,
    methodName
) {
    functString = functString || this.$vtable[ordinal][methodName].toString();

    return (
        functString.indexOf('$parent') > -1 ||
        functString.indexOf('$super') > -1
    )
        ? function() {
            var ret,
                $parent = this.$parent,
                $super = this.$super
                ;
            
            this.$parent = this.$vtable[parentOrdinal] || $parent;
            this.$super = this.$vtable[superOrdinal][superName];

            ret = this.$vtable[ordinal][methodName].apply(this, arguments);

            this.$parent = $parent;
            this.$super = $super;
            
            return ret;
        }
        : this.$vtable[ordinal][methodName]
        ;
};

/**
 * @memberOf $thing
 * @method switchParentContext
 */
$thing.switchParentContext = function(
    functString,
    parentOrdinal,
    ordinal,
    methodName
) {
    functString = functString || this.$vtable[ordinal][methodName].toString();

    return (
        functString.indexOf('$parent') > -1
    )
        ? function() {
            var ret,
                $parent = this.$parent
                ;
            
            this.$parent = this.$vtable[parentOrdinal] || this.$parent;

            ret = this.$vtable[ordinal][methodName].apply(this, arguments);

            this.$parent = $parent;
            
            return ret;
        }
        : this.$vtable[ordinal][methodName]
        ;
};

/**
 * @class Object
 * @memberOf $thing
 */
$thing.Object = function(){};

/**
 * Return object name
 * @memberOf $thing
 * @method Object#getName
 * @returns {string}
 */
$thing.Object.prototype.getName = function(){
    return 'Object';
};

/**
 * @memberOf $thing
 * @method Object.inherit
 * @param {object} obj
 * @param {object} parent
 * @returns {object}
 */
var $inherit = $thing.Object.inherit = function(obj, parent) {
    var i,
        j,
        k,
        v,
        functString,
        signature,
        signatures = {},
        ontology = {},
        properties = {},
        inherit = this.prototype
        ;
        
    function $obj() {
        /*jshint validthis:true */
        (this.init !== undefined)
            ? this.init.apply(this, arguments)
            : undefined
            ;
    }

    function replace() {
        return (obj['$' + arguments[1]] !== undefined)
            ? obj['$' + arguments[1]]
            : arguments[0]
            ;
    }
    
    $obj.prototype = new this();
    $obj.prototype.constructor = $obj;
    $obj.prototype.$vtable = ($obj.prototype.$vtable !== undefined)
        ? $obj.prototype.$vtable.slice()
        : []
        ;
    
    var ordinal = $obj.prototype.$vtable.push(obj) - 1,
        parentOrdinal = $obj.prototype.$vtable.push(parent) - 1,
        superOrdinal = $obj.prototype.$vtable.push(inherit) - 1
        ;
    
    $obj.inherit = $inherit;
    
    for (i in obj) {

        switch(i) {
            case '$vtable':
                /* falls through */
            case '$signatures':
                /* falls through */
            case '$properties':
                /* falls through */
            case '$ontology':
                /* falls through */
            case '$owner':
                /* falls through */
            case '$parent':
                /* falls through */
            case '$super':
                /* falls through */
                continue;
        }
        
        v = obj[i];
        k = i.replace(/\$\((.+?)\)/g, replace);
        j = k.substring(k.indexOf('.') + 1);
        
        if (typeof v !== 'function')
            switch(k.charAt(0)) {

                case '@':
                    var tokens = k.match(/\S+/g);

                    if (tokens.length !== 2) ontology[k] = v;
                    else {

                        switch(tokens[0]) {

                            case '@property':
                                if (typeof v === 'object')
                                    properties[tokens[1]] = v;
                                else
                                    ontology[k] = v;
                                break;

                            default:
                                ontology[k] = v;

                        }

                    }

                    break;

                case '$':
                    $obj.prototype[k] = v;
                    break;

                default:
                    ontology[k] = v;

            }
        else {

            functString = v.toString();
            signature = functString.match(/function[^(]*\(([^)]*)\)/);
            
            (typeof inherit[k] !== 'function')
                ? (typeof inherit[j] !== 'function')
                    ? $obj.prototype[k] = $thing.switchParentContext.apply(
                        $obj.prototype,
                        [   functString,
                            parentOrdinal,
                            ordinal,
                            i
                        ]
                    )
                    : $obj.prototype[k] = $thing.switchContext.apply(
                        $obj.prototype,
                        [   functString,
                            parentOrdinal,
                            superOrdinal,
                            ordinal,
                            j,
                            i
                        ]
                    )
                : $obj.prototype[k] = $thing.switchContext.apply(
                    $obj.prototype,
                    [   functString,
                        parentOrdinal,
                        superOrdinal,
                        ordinal,
                        k,
                        i
                    ]
                )
                ;
            
            if (signature !== null)
                signatures[k] = (signature[1].length)
                    ? signature[1].split(/,\s*/)
                    : []
                    ;
        }
    }
    
    $obj.prototype.$owner = parent || $obj.prototype.$owner;

    $obj.prototype.$signatures = $thing.merge(
        signatures,
        $obj.prototype.$signatures
    );

    $obj.prototype.$properties = $thing.merge(
        properties,
        $obj.prototype.$properties
    );

    $obj.prototype.$ontology = $thing.merge(
        ontology,
        $obj.prototype.$ontology
    );

    return $obj;
};