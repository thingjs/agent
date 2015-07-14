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

$thing.KnownMeta = {
    'flow': '',
    'push': '',
    'concurrency': '',
    'limit': '',
    'author': 'string',
    'description': 'string',
    'tag': 'tokens'
};

$thing.agent('@singleton', 'Util', {

    setup: function(cb) {
        this.$super(cb);

        /**
         * @class Complete
         * @mixes $thing.Behaviour
         */
        this.addBehaviour(
            '@passive',
            '@catchall catchAll',
            'Complete', {
                catchAll: function(args, $cb) {
                    $cb('onComplete')();
                }
            }
        );

        /**
         * @class Error
         * @mixes $thing.Behaviour
         */
        this.addBehaviour(
            '@passive',
            '@catchall catchAll',
            'Error', {
                catchAll: function(args, $cb) {
                    $cb('onError', -1)();
                }
            }
        );

        /**
         * @class Sensor
         * @mixes Queue
         * @abstract
         */
        this.addBehaviour('abstract Sensor extends Queue');

        /**
         * @class Actuator
         * @mixes Queue
         * @abstract
         */
        this.addBehaviour('abstract Actuator extends Queue');

        /**
         * @class Bridge
         * @mixes Queue
         * @abstract
         */
        this.addBehaviour(
            'abstract Bridge extends Queue implements Actuator Sensor'
        );
    }
    
});