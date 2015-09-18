'use strict';

var agent = $thing.agent;

exports['Parallel'] = function(test) {
    test.expect(5);
    agent({
        setup: function(cb) {
            test.ok(true, 'setup');
            this.$super(cb);
            this.addBehaviour(
                '@flow method1 method2 method3',
                'extends Parallel', {
                    method1: function($cb) {
                        test.ok(true, 'method1');
                        $cb('end', 'method1')();
                    },
                    method2: function($cb) {
                        test.ok(true, 'method2');
                        $cb('end', 'method2')();
                    },
                    method3: function($cb) {
                        test.ok(true, 'method3');
                        $cb('end', 'method3')();
                    }
                }
            );
        },
        takedown: function(cb) {
            test.ok(true, 'takedown');
            this.$super(cb);
            test.done();
        }
    });
};