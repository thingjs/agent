'use strict';

var agent = $thing.agent;

exports['behaviour'] = function(test) {
    var i = 0, 
        j = 0
        ;

    test.expect(6);
    agent('A', {
        setup: function(cb) {
            test.ok(true, 'setup');
            this.$super(cb);
            this.addBehaviour({
                action: function($cb) {
                    if (++i === 1) test.ok(true, 'action');
                    this.$super($cb);
                },
                done: function() {
                    if (++j === 1) test.ok(true, 'done');
                    return true;
                }
            });
            agent('A')('method')();
        },
        method: function($cb) {
            test.ok(true, 'method');
            $cb();
        },
        takedown: function(cb) {
            test.equal(this.getChildren().length, 0, 'this.getChildren().length == 0');
            test.ok(true, 'takedown');
            this.$super(cb);
            test.done();
        }
    });
};

exports['@passive behaviour'] = function(test) {
    test.expect(2);
    agent({
        setup: function(cb) {
            test.ok(true, 'setup');
            this.behaviour = this.addBehaviour(
                '@passive',
                'PassiveBehaviour', {
                    action: function($cb) {
                        test.ok(false, 'action');
                        this.$super($cb);
                    },
                    done: function() {
                        test.ok(false, 'done');
                        return true;
                    },
                    method: function($cb) {
                        test.ok(true, 'method');
                        $cb();
                    },
                    testDone: function($cb) {
                        test.done();
                        $cb();
                    }
                }
            );
            this.$super(cb);
        },
        takedown: function(cb) {
            test.ok(false, 'takedown');
            this.$super(cb);
        }
    });
    agent('PassiveBehaviour')
        ('method')()
        ('testDone')()
        ;
};

exports['abstract behaviour'] = function(test) {
    test.expect(1);
    agent({
        setup: function(cb) {
            test.ok(true, 'setup');
            this.addBehaviour(
                'abstract AbstractBehaviour', {
                    action: function($cb) {
                        test.ok(false, 'action');
                        this.$super($cb);
                    },
                    done: function() {
                        test.ok(false, 'done');
                        return true;
                    },
                    method: function($cb) {
                        test.ok(false, 'method');
                        $cb();
                    }
                }
            );
            this.$super(cb);
        },
        takedown: function(cb) {
            test.ok(false, 'takedown');
            test.done();
        }
    });
    agent('AbstractBehaviour')('method')();
    test.done();
};

exports['removeBehaviour'] = function(test) {
    agent(
        '@singleton',
        '@passive',
        'abstract AA', {
        }
    );
    agent({
        setup: function(cb) {
            this.$super(cb);
            test.expect(1);
            var b = this.addBehaviour('AA$(index) extends AA', 1);
            b = this.addBehaviour('AA$(index) extends AA', 1);
            this.removeBehaviour(b);
            test.ok(this.getChildren().length === 0, 'this.getChildren().length === 0');
        },
        takedown: function(cb) {
            this.$super(cb);
            test.done();
        }
    });
};