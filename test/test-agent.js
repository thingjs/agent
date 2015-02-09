'use strict';

if (typeof agent === 'undefined') {

    var contextify = require('contextify'),
        agent = require('../bootstrap/node.js')
        ;

    process.on('uncaughtException', function(err) {
        console.error(err.stack);
    });

}

exports['agent'] = function(test) {
    test.expect(2);
    agent({
        setup: function(cb) {
            test.ok(true, 'setup');
            this.$super(cb);
        },
        takedown: function(cb) {
            test.ok(true, 'takedown');
            this.$super(cb);
            test.done();
        }
    });
};

exports['@passive agent'] = function(test) {
    test.expect(1);
    agent('@passive', {
        setup: function(cb) {
            test.ok(true, 'setup');
            this.$super(cb);
        },
        takedown: function(cb) {
            test.ok(false, 'takedown');
            this.$super(cb);
        }
    });
    test.done();
};

exports['abstract agent'] = function(test) {
    test.expect(0);
    agent('abstract', {
        setup: function(cb) {
            test.ok(false, 'setup');
            this.$super(cb);
        },
        takedown: function(cb) {
            test.ok(false, 'takedown');
            this.$super(cb);
        }
    });
    test.done();
};

exports['behaviour'] = function(test) {
    test.expect(6);
    agent('A', {
        setup: function(cb) {
            test.ok(true, 'setup');
            this.$super(cb);
            this.addBehaviour({
                action: function($cb) {
                    test.ok(true, 'action');
                    this.$super($cb);
                },
                done: function() {
                    test.ok(true, 'done');
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
            this.$super(cb);
            test.done();
        }
    });
    agent('AbstractBehaviour')('method')();
    test.done();
};

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
                    ['Agent', this.$id, this.getSource(), 'H', /pattern/g, 'G'], 'getInterfaces() == ["Agent", "H", /pattern/g, "G"]'
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

exports['meta'] = function(test) {
    test.expect(5);
    agent(
        '@a',
        '@b once +', 'upon $ +', 'a', 'time',
        '@c',
        '@passive',
        'J', {
            setup: function(cb) {
                if (this.getInterfaces().indexOf('K') == -1) { // meta is _not_ inherited
                    test.ok(true, 'J.setup');
                    test.deepEqual(
                        this.getMeta(),
                        ['a', 'b once upon a time', 'c', 'passive'],
                        'this.getMeta() == ["a", "b once upon a time", "c", "passive"]'
                    );
                }
                else {
                    test.deepEqual(
                        this.getMeta(),
                        ['a', 'b once upon a time', 'c', 'passive', 'd'],
                        'this.getMeta() == ["a", "b once upon a time", "c", "passive", "d"]'
                    );
                }
                this.$super(cb);
            }
        }
    );
    agent(
        '@d',
        'K extends J', {
            setup: function(cb) {
                test.ok(true, 'K.setup');
                test.deepEqual(
                    this.getMeta(),
                    ['a', 'b once upon a time', 'c', 'passive', 'd'],
                    'this.getMeta() == ["a", "b once upon a time", "c", "passive", "d"]'
                );
                this.$super(cb);
            }
        }
    );
    test.done();
};

exports['callbacks'] = function(test) {
    test.expect(13);
    agent(
        '@passive',
        'L', {
            setup: function(cb) {
                test.ok(true, 'setup');
                this.$super(cb);
            },
            method1: function(a, $cb) {
                test.ok(true, 'method1');
                test.equal(a, 1, 'method1: a == 1');
                $cb();
            },
            method2: function(a, b, c, $cb) {
                test.ok(true, 'method2');
                test.equal(a, 1, 'method2: a == 1');
                test.equal(b, 2, 'method2: b == 2');
                test.equal(c, 3, 'method2: c == 3');
                $cb('onMethod2Return', b)(this);
            },
            method3: function(b, $cb) {
                test.ok(true, 'method3');
                test.equal(b, 2, 'method3: b == 2');
                $cb('done', b)();
            },
            done: function(b, $cb) {
                test.ok(true, 'done');
                test.equal(b, 2, 'done: b == 2');
                $cb();
                test.done();
            }
        }
    );
    agent('L')('method1', 1)();
    agent('L')('method2', 1, 2, 3)({
        onMethod2Return: function(b, $cb) {
            test.ok(true, 'onMethod2Return');
            test.equal(b, 2, 'onMethod2Return: b == 2');
            $cb('method3', b)('L');
        }
    });
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

exports['dispatch'] = function(test) {
    test.expect(8);
    agent(
        'abstract O', {
            'Q.method2': function($cb) {
                test.ok(true, 'Q.method2 super');
                $cb();
            },
            'method2': function($cb) {
                test.ok(false, 'method2 super');
                $cb();
            },
            'method3': function($cb) {
                test.ok(true, 'method3 super');
                $cb();
            }
        }
    );
    agent('P extends O implements Q /reg/g', {
        setup: function(cb) {
            this.$super(cb);
            test.ok(true, 'setup');
            agent('P')('method')();
            agent('P')('$method')();
            agent('Q')('method2')();
            agent('Q')('method3')();
            agent('regex')('method3')();
        },
        method: function($cb) {
            test.ok(true, 'method');
            $cb();
        },
        $method: function($cb) {
            test.ok(false, '$method');
            $cb();
        },
        'Q.method2': function($cb) {
            test.ok(true, 'O.method2');
            this.$super($cb);
        },
        'method2': function($cb) {
            test.ok(false, 'method2');
            $cb();
        },
        'Q.method3': function($cb) {
            test.ok(true, 'Q.method3');
            this.$super($cb);
        },
        '/reg/g.method3': function($cb) {
            test.ok(true, '/reg/g.method3');
            $cb();
        },
        'method3': function($cb) {
            test.ok(false, 'method3');
            $cb();
        },
        takedown: function(cb) {
            test.ok(true, 'takedown');
            this.$super(cb);
            test.done();
        }
    });
};

exports['substitute'] = function(test) {
    test.expect(5);
    var uuid1 = 'uuid1';
    agent(
        'implements $(interface1)', uuid1,
        '@$(x)', true,
        'R', {
            setup: function(cb) {
                this.$super(cb);
                test.ok(true, 'setup');
                test.equal(this.$interface1, 'uuid1', 'this.$interface1 == "uuid1"');
                test.equal(this.$x, true, 'this.$x == true');
                agent(uuid1)('method')();
            },
            takedown: function(cb) {
                test.ok(true, 'takedown');
                this.$super(cb);
                test.done();
            },
            '$(interface1).method': function($cb) {
                test.ok(true, '$(interface1).method');
                $cb();
            }
        }
    );
};

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
                        $cb('done')();
                    },
                    method2: function($cb) {
                        test.ok(true, 'method2');
                        this.$parent.v++;
                        (this.$parent.v == 3)
                            ? $cb()
                            : $cb('done')()
                            ;
                    },
                    method3: function($cb) {
                        test.ok(this.$parent.v > 2, '$parent.v > 2');
                        $cb('done')();
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
                        $cb('done')();
                    },
                    method2: function($cb) {
                        test.ok(true, 'method2');
                        $cb('done')();
                    },
                    method3: function($cb) {
                        test.ok(true, 'method3');
                        $cb('done')();
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
                            ? $cb('done')()
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
            done: function($cb) {
                test.ok(true, 'done');
                $cb();
            },
            doneWithError: function(errs, $cb) {
                test.ok(false, 'doneWithError');
                $cb();
            }
        })
        ;
    agent('Queue1')
        ('push', ['g', 'h', 'i', 'j', 'k', 'l'])({
            done: function($cb) {
                test.ok(false, 'done');
                $cb();
            },
            doneWithError: function(errs, $cb) {
                test.ok(true, 'doneWithError');
                test.deepEqual(
                    errs,
                    [undefined, undefined, undefined, undefined, undefined, -1]
                );
                $cb();
            }
        })
        ;
};

exports['Behaviour reset'] = function(test) {
    test.expect(5);
    agent({
        setup: function(cb) {
            test.ok(true, 'setup');
            this.$super(cb);
            this.counter = 0;
            var b1 = this.addBehaviour(
                '@flow method1',
                'extends Series', {
                    method1: function($cb) {
                        test.ok(true, 'method1');
                        $cb('done')();
                    }
                }
            );
            this.addBehaviour({
                action: function($cb) {
                    b1.reset();
                    this.$super($cb);
                },
                done: function() {
                    return (++this.$parent.counter < 4)
                        ? false
                        : true
                        ;
                }
            });
        },
        takedown: function(cb) {
            test.ok(true, 'takedown');
            this.$super(cb);
            test.done();
        }
    });
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

exports['select'] = function(test) {
    test.expect(3);
    agent(
        '@passive',
        'X implements Y', {
            method: function($cb) {
                test.ok(true, 'X(Y).method');
                $cb();
            },
            method2: function($cb) {
                test.ok(false, 'X(Y).method2');
                $cb();
            }
        }
    );
    agent(
        'X implements Z', {
            setup: function(cb) {
                this.$super(cb);
                agent('@select X and Y or X and Z')
                    ('method')('@select T or X not Y')
                    ;
            },
            method: function($cb) {
                test.ok(true, 'X(Z).method');
                $cb('method2')();
            },
            method2: function($cb) {
                test.ok(true, 'X(Z).method2');
                $cb();
            },
            takedown: function(cb) {
                this.$super(cb);
                test.done();
            }
        }
    );
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

exports['Done'] = function(test) {
    test.expect(1);
    agent('BB or Done')
        ('method')({
            done: function($cb) {
                test.ok(true, 'done');
                test.done();
                $cb();
            }
        });
};

exports['Error'] = function(test) {
    test.expect(1);
    agent('BB or Error')
        ('method')({
            doneWithError: function(err, $cb) {
                test.ok(true, 'doneWithError');
                test.done();
                $cb();
            }
        });
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

exports['filters'] = function(test) {
    test.expect(7);

    agent(
        '@passive', 
        'implements CC', {

            method: function($cb) {
                test.ok(true, 'method');
                $cb();
            }

        }
    );

    agent(
        '@passive', 
        'implements CC', {

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

    agent('@select CC')
        .first('method')()
        .last('method')()
        .all('method')()
        ('method')()
        ('done')()
        ;

};

exports['Waker'] = function(test) {
    test.expect(2);

    agent('extends Heartbeat');

    agent({

        setup: function(cb) {
            this.$super(cb);

            this.counter = 0;

            this.addBehaviour(
                'extends Waker', {

                    wake: function(cb) {
                        test.ok(true, 'wake');

                        if (++this.$owner.counter < 2) 
                            this.reset();
                
                        this.$super(cb);
                    }

                }
            );

        },

        takedown: function(cb) {
            agent('Heartbeat')('destroy')();
            this.$super(cb);
            test.done();
        }

    });

};

exports['@singleton Waker'] = function(test) {
    test.expect(3);

    var woke = 0,
        time = Date.now()
        ;

    agent('extends Heartbeat');

    agent({
        setup: function(cb) {
            this.$super(cb);

            this.createWaker();

            this.intervalId = setInterval(
                this.bind(this.createWaker), 
                1000
            );

            this.addBehaviour('@passive', {});
        },

        createWaker: function() {
            this.addBehaviour(
                '@period 2000',
                '@singleton',
                'extends Waker', {
                    wake: function($cb) {
                         test.ok(true, 'wake');  
                        if (++woke > 2) {
                            clearInterval(this.$owner.intervalId);
                            agent('Heartbeat')('destroy')();
                            test.done();
                        }
                        this.$super($cb);
                    }
                }
            );
        }

    });

};

exports['Mqtt Actuator Sensor'] = function(test) {
    test.expect(12);

    var myTopic = Math.random().toString(36).slice(2);

    agent(
        '@host test.thingjs.org',
        ($thing.usePaho) ? '@port 8080' : '',
        'extends Mqtt', {

            setup: function(cb) {
                this.$super(cb);

                this.addBehaviour('$ extends Actuator', myTopic);

                this.addBehaviour(
                    '$ extends Sensor', myTopic, 
                    '@flow onMessage', {
                        onMessage: function(message, $cb) {
                            test.ok(message.toString() === 'Hello World!', 'onMessage');
                            agent('Container')('destroy')($cb);
                        }
                    }
                );

            },

            takedown: function(cb) {
                this.$super(cb);
                
                test.done();
            },

            onError: function(err) {
                test.ok(false, 'onError');
                
                this.$super(err);
            },

            onConnect: function() {
                test.ok(true, 'onConnect');
                
                this.$super();
            },

            onDisconnect: function() {
                test.ok(true, 'onDisconnect');
                
                this.$super();
            },

            doSendMessage: function(topic, message) {
                test.ok(true, 'doSendMessage');
                test.ok(topic === myTopic, 'doSendMessage topic');
                test.ok(message.toString() === 'Hello World!', 'doSendMessage message');
                
                this.$super(topic, message);
            },

            onMessageArrived: function(topic, message) {
                test.ok(true, 'onMessageArrived');
                test.ok(topic === myTopic, 'onMessageArrived topic');
                test.ok(message.toString() === 'Hello World!', 'onMessageArrived message');
                
                this.$super(topic, message);
            },

            onMessageDelivered: function(topic, message) {
                test.ok(true, 'onMessageDelivered');
                test.ok(topic === myTopic, 'onMessageDelivered topic');
                test.ok(message.toString() === 'Hello World!', 'onMessageDelivered message');
                
                this.$super(topic, message);
            }

        }
    );

    agent('@select Actuator $', myTopic)
        ('push', 'Hello World!')()
        ;

};

exports['Mqtt Bridge'] = function(test) {
    test.expect(12);

    var myTopic = Math.random().toString(36).slice(2);

    agent({
        setup: function(cb) {
            this.$super(cb);

            this.addBehaviour(
                'extends Queue implements $', myTopic, 
                '@flow onMessage', {
                    onMessage: function(message, $cb) {
                        test.ok(message.toString() === 'Hello World!', 'onMessage');    
                        agent('Container')('destroy')($cb);
                    }
                }
            );
        }
    });

    agent(
        '@host test.thingjs.org',
        ($thing.usePaho) ? '@port 8080' : '',
        'extends Mqtt', {

            setup: function(cb) {
                this.$super(cb);
                
                this.addBehaviour('$ extends Bridge', myTopic);

            },

            takedown: function(cb) {
                this.$super(cb);
                
                test.done();
            },

            onError: function(err) {
                test.ok(false, 'onError');
                
                this.$super(err);
            },

            onConnect: function() {
                test.ok(true, 'onConnect');
                
                this.$super();
            },

            onDisconnect: function() {
                test.ok(true, 'onDisconnect');
                
                this.$super();
            },

            doSendMessage: function(topic, message) {
                test.ok(true, 'doSendMessage');
                test.ok(topic === myTopic, 'doSendMessage topic');
                test.ok(message.toString() === 'Hello World!', 'doSendMessage message');
                
                this.$super(topic, message);
            },

            onMessageArrived: function(topic, message) {
                test.ok(true, 'onMessageArrived');
                test.ok(topic === myTopic, 'onMessageArrived topic');
                test.ok(message.toString() === 'Hello World!', 'onMessageArrived message');
                
                this.$super(topic, message);
            },

            onMessageDelivered: function(topic, message) {
                test.ok(true, 'onMessageDelivered');
                test.ok(topic === myTopic, 'onMessageDelivered topic');
                test.ok(message.toString() === 'Hello World!', 'onMessageDelivered message');
                
                this.$super(topic, message);
            }

        }
    );

    agent('@select Bridge $', myTopic)
        ('push', 'Hello World!')()
        ;    
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

exports['container'] = function(test) {
    test.expect(1);

    agent('@passive', 'CD', {});
    agent('extends CD');

    $thing.$container(function() {

        try {
            agent('extends CD');
        }
        catch(e) {
            test.ok(true, 'extends CD');
        }

        agent('@passive', 'CD', {});

        try {
            agent('extends CD');
        }
        catch(e) {
            test.ok(false, 'extends CD');
        }

    });

    test.done();
};

if (contextify !== undefined) {

    exports['contextify container'] = function(test) {
        test.expect(1);

        agent('@passive', 'CE', {});
        agent('extends CE');

        $thing.$container(function() {
            var self = contextify({ agent: agent });
        
            try {
                self.run('agent("extends CE");');
            }
            catch(e) {
                test.ok(true, 'extends CE');
            }

            agent('@passive', 'CE', {});

            try {
                self.run('agent("extends CE");');
            }
            catch(e) {
                test.ok(false, 'extends CE');
            }

        });

        test.done();
    };

}