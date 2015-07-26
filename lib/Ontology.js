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

$thing.Wot = {

    '@context': {

        'wot': 'http://thingjs.org/wot/',

        'wot:author': {
            '@container': '@list'
        },

        'wot:description': {
            '@container': '@list'
        },

        'wot:tag': {
            '@container': '@list'
        }

    },

    'meta': {
        'author': 'string',
        'description': 'string',
        'tag': 'tokens'
    }

};

/**
 * @class Ontology
 * @mixes $thing.Base
 * @memberOf $thing
 */
$thing.Ontology = new ($thing.Base.inherit({

    getName: function() {
        return 'Ontology';
    },

    compact: function(ontology, graph, cb) {
        var keys = Object.keys(graph),
            values = new Array(keys.length)
            ;

        for (var i in keys)
            values[i] = graph[keys[i]];

        $thing.jsonld.compact({
                '@graph': values         
            },
            ontology, {
                graph: true
            },
            function(err, doc) {

                if (err) return cb(err);
                
                if (typeof doc['@graph'] === undefined || 
                    doc['@graph'].length !== keys.length
                ) 
                    return cb(-1);

                cb(undefined, $thing.arrayToObject(doc['@graph'], keys));

            }
        );

    }

}))();