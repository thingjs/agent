'use strict';

var agent = $thing.agent;

exports['uses'] = function(test) {
    test.expect(4);
    agent(
        '@passive',
        'C', {
            method: function($cb) {
                test.ok(true, 'method');
                $cb();
            }
        }
    );
    agent(
        '@passive',
        'D', {
            method: function($cb) {
                test.ok(true, 'method');
                $cb();
            },
            done: function($cb) {
                test.ok(true, 'done');
                test.done();
                $cb();
            }
        }
    );
    agent('@passive', 'uses C D', function(c, d) {
        return {
            setup: function(cb) {
                this.$super(cb);
                test.ok(true, 'setup');
                c('method')();
                d('method')();
                d('done')();
            }
        };
    });
};

exports['extends'] = function(test) {
    test.expect(7);
    agent(
        'abstract E', {
            setup: function(cb) {
                test.ok(true, 'E.setup');
                this.test = 1;
                this.$super(cb);
            },
            method: function() {
                test.ok(true, 'E.method');
                this.test+= 1;
            }
        }
    );
    agent(
        'abstract F extends E', {
            setup: function(cb) {
                test.ok(true, 'F.setup');
                this.$super(cb);
            }
        }
    );
    agent(
        'extends F', {
            setup: function(cb) {
                test.ok(true, '(anonymous).setup');
                this.$super(cb);
                var behaviour = this.addBehaviour({

                });
                behaviour.block();
                test.equal(this.getChildren().length, 1, 'getChildren().length == 1');
                this.method();
                test.equal(this.test, 3, 'test == 3');
            },
            method: function() {
                test.ok(true, '(anonymous).method');
                this.test+= 1;
                this.$super();
            }
        }
    );
    test.done();
};

exports['implements'] = function(test) {
    test.expect(5);
    agent(
        'G implements H /pattern/g', {
            setup: function(cb) {
                test.ok(true, 'setup');
                this.addBehaviour(
                    'I implements H', {
                        method: function($cb) {
                            test.ok(true, 'I.method');
                            test.deepEqual(
                                this.getInterfaces(),
                                ['Behaviour', 'parent:' + this.$parent.$id, 'owner:' + this.$owner.$id, this.$id, this.getSource(), 'H', 'I'], 'getInterfaces() == ["Behaviour", "H", "I"]'
                            );
                            this.block($cb);
                        }
                    }
                );
                this.$super(cb);
            },
            method: function($cb) {
                test.ok(true, 'G.method');
                test.deepEqual(
                    this.getInterfaces(),
                    ['Agent', 'Description', 'Properties', this.$id, this.getSource(), 'H', /pattern/g, 'G'], 'getInterfaces() == ["Agent", "H", /pattern/g, "G"]'
                );
                $cb();
                
            },
            done: function($cb) {
                test.done();
                $cb();
                
            }
        }
    );
    agent('H')('method')();
    agent('G')('done')();
};

exports['parent'] = function(test) {
    test.expect(6);
    agent({
        setup: function(cb) {
            test.ok(true, 'setup');
            this.a = 0;
            this.addBehaviour(
                '@passive',
                'M', {
                    method: function($cb) {
                        test.ok(true, 'M.method');
                        this.$parent.a+= 1;
                        test.equal(this.$parent.a, 1, 'parent.a == 1');
                        $cb();
                    }
                }
            );
        }
    });
    agent({
        setup: function(cb) {
            test.ok(true, 'setup');
            this.addBehaviour(
                '@passive',
                'N extends M', {
                    method: function($cb) {
                        test.ok(true, 'N.method');
                        test.equal(this.$parent.a, undefined, 'parent.a == undefined');
                        $cb();
                    },
                    testDone: function($cb) {
                        test.done();
                        $cb();
                    }
                }
            );
        }
    });
    agent('M')('method')();
    agent('N')('testDone')();
};

exports['singleton'] = function(test) {
    test.expect(2);
    agent(
        '@passive',
        'R', {
            method: function($cb) {
                test.ok(true, 'method');
                $cb();
            }
        }
    );
    var singleton = function() {
        agent(
            '@passive',
            '@singleton',
            'R', {
                method: function($cb) {
                    test.ok(true, 'method');
                    $cb();
                },
                done: function($cb) {
                    test.done();
                    $cb();
                }
            }
        );
    };
    singleton();
    singleton();
    singleton();
    agent('R')
        ('method')()
        ('done')()
        ;
};

exports['Singleton Unref'] = function(test) {
    test.expect(8);

    agent(
        '@singleton', 
        'abstract BC', {

            setup: function(cb) {
                this.$super(cb);
                test.ok(true, 'setup 1');
            },

            takedown: function(cb) {
                this.$super(cb);
                test.ok(true, 'takedown 1');
            }

        }
    );

    agent(
        'extends BC', {

            setup: function(cb) {
                this.$super(cb);
                test.ok(true, 'setup 2');
            },

            takedown: function(cb) {
                this.$super(cb);
                test.ok(true, 'setup 2');
            }

        }
    );

    agent(
        'extends BC', {

            setup: function(cb) {
                this.$super(cb);
                test.ok(true, 'setup 3');
            },

            takedown: function(cb) {
                this.$super(cb);
                test.ok(true, 'setup 3');
                test.done();
            }

        }
    );

};