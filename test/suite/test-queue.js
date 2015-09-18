'use strict';

var agent = $thing.agent;

exports['Queue'] = function(test) {
    test.expect(16);
    agent({
        setup: function(cb) {
            test.ok(true, 'setup');
            this.$super(cb);
            this.addBehaviour(
                '@concurrency 5',
                '@flow method1',
                'Queue1 extends Queue', {
                    method1: function(item, $cb) {
                        test.ok(true, 'method1');
                        (item == 'k')
                            ? $cb('end', 'method1')()
                            : $cb()
                            ;
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
    agent('Queue1')
        ('push', ['a', 'b', 'c', 'd', 'e', 'f'])({
            complete: function($cb) {
                test.ok(true, 'complete');
                $cb();
            },
            error: function(err, $cb) {
                test.ok(false, 'error');
                $cb();
            }
        })
        ;
    agent('Queue1')
        ('push', ['g', 'h', 'i', 'j', 'k', 'l'])({
            complete: function($cb) {
                test.ok(false, 'complete');
                $cb();
            },
            error: function(err, $cb) {
                test.ok(true, 'error');
                test.ok(err === -1, 'err === -1');
                $cb();
            }
        })
        ;
};

exports['Queue Reset'] = function(test) {
    test.expect(1);

    agent({

        setup: function(cb) {
            this.$super(cb);

            var queue = this.addBehaviour('extends Queue', '@flow doItem1 doItem2', {

                doItem1: function(item, $cb) {

                    test.ok(false, 'doItem1');
                    
                    $cb('end', 'doItem1')();
                },

                doItem2: function(item, $cb) {
                    
                    test.ok(item === 2, 'item === 2');
                    
                    $cb('end', 'doItem2')();
                }


            });

            agent(queue)
                ('pause')()
                ('end', 'doItem1')()
                ('push', 1)()
                ('push', 3)()
                ('push', 4)()
                ('reset')()
                ('push', 2)()
                ;

        },

        takedown: function(cb) {
            this.$super(cb);
            test.done();
        }

    });

};