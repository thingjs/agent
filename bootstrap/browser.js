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

if (typeof async === 'undefined' || typeof async.setImmediate === 'undefined')
    throw new Error('async missing: https://github.com/caolan/async');

if (typeof jsonld === 'undefined' || typeof jsonld.compact === 'undefined')
    throw new Error('jsonld missing: https://github.com/digitalbazaar/jsonld.js');

var $thing = $thing || {};

$thing.bootstrap = 'browser.js';
$thing.usePaho = true;

$thing.async = async;
$thing.jsonld = jsonld;

$thing.getMicroTime = function() {
    return Date.now() * 1000;
};

if (!!window.chrome) {

    $thing.getThreadId = function(first, container) {

        first = first || 0;

        var threadId = [undefined, container || 'main'],
            stackTraceLimit = Error.stackTraceLimit,
            prepareStackTrace = Error.prepareStackTrace
            ;

        first++;

        Error.prepareStackTrace = function(err, frame) {

            if (frame.length > first) {

                threadId[0] = frame[first].getFileName() + 
                    ':' + frame[first].getLineNumber() +
                    ':' + frame[first].getColumnNumber()
                    ;

                if (container === undefined)
                    for (var i = 0; i < frame.length - 1; i++)
                        if (frame[i].getFunctionName() === '$thing.$container') {

                            threadId[1] = frame[i + 1].getFileName() +
                                ':' + frame[i + 1].getLineNumber() +
                                ':' + frame[i + 1].getColumnNumber()
                                ;

                            break;

                        }

            }
             
        };

        Error.stackTraceLimit = container ? first + 1 : Infinity;

        new Error().stack;

        Error.stackTraceLimit = stackTraceLimit;
        Error.prepareStackTrace = prepareStackTrace;

        return threadId;
    };

}
else {

    $thing.getBacktrace = function(first) {
        first = first || 0;

        try {
            0(); 
        }
        catch(e) {
            var trace = e.stack
                    .replace(/Object\.\$thing\.\$container [^\r\n\t\f ]+/g, '$container:0:0')
                    .replace(/\$thing\.\$container@[^\r\n\t\f ]+/g, '$container:0:0')
                    .replace(/\$container@[^\r\n\t\f ]+/g, '$container:0:0')
                ;

            if ((trace = trace.match(/[^\r\n\t\f\( ]+\d\:\d+/g)) !== null)
                return trace.slice(1 + first);
            else if ((trace = trace.match(/\s+at /g)) !== null)
                return trace.slice(1 + first);
            return [];
        }
    };

    $thing.getThreadId = function(first, container) {
        var threadId = [undefined, container || 'main'],
            frame = $thing.getBacktrace(first + 1)
            ;

        threadId[0] = frame[0];

        for (var i = 0; i < frame.length - 1; i++) 
            if (frame[i].indexOf('$container:0:0') > -1) {

                threadId[1] = frame[i + 1];

                break;

            }

        return threadId;
    };

}

$thing.createBuffer = function(byteArray) {
    return {
        buf: byteArray,
        toString: function() {
            return String.fromCharCode.apply(
                null, 
                new Uint16Array(byteArray)
            );
        }
    };
};