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

var $thing = $thing || {};

$thing.bootstrap = 'browser.js';
$thing.usePaho = true;

$thing.async = async;

$thing.getMicroTime = function() {
    return Date.now() * 1000;
};

$thing.getBacktrace = function(first) {
    first = first || 0;

    try {
        0(); 
    }
    catch(e) {
        var trace;

        if ((trace = e.stack.match(/\S+\:\d+/g)) !== null)
            return trace.slice(1 + first);
        else if ((trace = e.stack.match(/\s+at /g)) !== null)
            return trace.slice(1 + first);
        return [];
    }
};

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