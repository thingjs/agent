'use strict';

var agent = $thing.agent;

exports['Series'] = function(test) {
    test.expect(6);
    agent({
        setup: function(cb) {
            test.ok(true, 'setup');
            this.$super(cb);
            this.v = 1;
            this.addBehaviour(
                '@flow method2 method3',
                'extends Series', {
                    getFlow: function() {
                        return this.$super('method1');
                    },
                    method1: function($cb) {
                        test.equal(this.$parent.v, 1, '$parent.v == 1');
                        this.$parent.v = 2;
                        $cb('end', 'method1')();
                    },
                    method2: function($cb) {
                        test.ok(true, 'method2');
                        this.$parent.v++;
                        (this.$parent.v == 3)
                            ? $cb()
                            : $cb('end', 'method2')()
                            ;
                    },
                    method3: function($cb) {
                        test.ok(this.$parent.v > 2, '$parent.v > 2');
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