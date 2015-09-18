'use strict';

var agent = $thing.agent;

exports['empty token'] = function(test) {
    test.expect(1);
    agent(
        '', 'implements S', '', {
        setup: function(cb) {
            this.$super(cb);
            agent('S')
                ('method')()
                ('done')()
                ;
        },
        method: function($cb) {
            test.ok(true, 'method');
            $cb();
        },
        done: function($cb) {
            test.done();
            $cb();
        }
    });
};

exports['BUG:A280115'] = function(test) {
    test.expect(0);

    agent('@', {
        setup: function(cb) {
            this.$super(cb);

            $thing.searchMeta(this, 'test', function(value) {
                test.ok(false, 'searchMeta = ' + value);
            });

            test.done();
        }
    });

};