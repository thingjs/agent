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
            onComplete: function($cb) {
                test.ok(true, 'onComplete');
                $cb();
            },
            onError: function(err, $cb) {
                test.ok(false, 'onError');
                $cb();
            }
        })
        ;
    agent('Queue1')
        ('push', ['g', 'h', 'i', 'j', 'k', 'l'])({
            onComplete: function($cb) {
                test.ok(false, 'onComplete');
                $cb();
            },
            onError: function(err, $cb) {
                test.ok(true, 'onError');
                test.ok(err === -1, 'err === -1');
                $cb();
            }
        })
        ;
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

exports['Complete'] = function(test) {
    test.expect(1);
    agent('BB or Complete')
        ('method')({
            onComplete: function($cb) {
                test.ok(true, 'onComplete');
                test.done();
                $cb();
            }
        });
};

exports['Error'] = function(test) {
    test.expect(1);
    agent('BB or Error')
        ('method')({
            onError: function(err, $cb) {
                test.ok(true, 'onError');
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

exports['MapReduce'] = function(test) {
    test.expect(104);

    agent({

        setup: function(cb) {
            this.$super(cb);

            var j = 0;

            var mapReduce = this.addBehaviour('extends MapReduce', '@flow map', {

                map: function(value, $cb) {
                    test.ok(true, 'map');

                    this.write(value % 2, value);

                    $cb();
                },

                reduce: function(values, cb) {
                    test.ok(true, 'reduce');
                    test.ok(values.length === 50, 'values.length === 50');

                    if (++j === 2) this.endAll();

                    this.$super(values, cb);

                }

            });

            mapReduce = agent(mapReduce);

            mapReduce('pause')();

            for (var i = 0; i < 100; i++)
                mapReduce('push', i)();

            mapReduce('resume')();

        },

        takedown: function(cb) {
            this.$super(cb);
            test.done();
        }

    });

};

exports['MapReduce Push'] = function(test) {
    test.expect(11);

    agent('@passive', 'CF implements CI', {

        push: function(value, $cb) {

            test.ok(true, 'CF.push');

            test.ok(
                value === 1 || value === 3, 
                'value === 1 || value === 3'
            );

            $cb();
        }

    });

    agent('@passive', 'CG implements CI', {

        push: function(value, $cb) {

            test.ok(false, 'CG.push');

            $cb();
        }

    });

   agent('@passive', 'CH', {

        push: function(value, $cb) {

            test.ok(true, 'CH.push');

            test.ok(
                value === 1 || value === 3, 
                'value === 1 || value === 3'
            );

            $cb();
        }

    });


    agent({

        setup: function(cb) {
            this.$super(cb);

            var mapReduce = this.addBehaviour(
                'extends MapReduce', 
                '@flow map', 
                '@push CH', 
                '@push CI not CG', {

                map: function(value, $cb) {
                    test.ok(true, 'map');

                    this.write(value, value);

                    if (value === 3) 
                        $cb('end', 'map')();
                    else 
                        $cb();
                },

                reduce: function(values, cb) {

                    this.$super(values[0] === 2 ? undefined : values[0], cb);

                }

            });

            agent(mapReduce)
                ('push', [1, 2, 3])()
                ;

        },

        takedown: function(cb) {
            this.$super(cb);
            test.done();
        }

    });

};

exports['MapReduce reset'] = function(test) {
    test.expect(2);

    agent({

        setup: function(cb) {
            this.$super(cb);

            this.addBehaviour('CL extends MapReduce', '@flow map', {

                map: function(value, $cb) {
                    test.ok(value === 2, 'value === 2');

                    this.write(value, value);

                    $cb('end', 'map')();
                },

                reduce: function(values, cb) {

                    test.ok(values[0] === 2, 'value[0] === 2');

                    this.$super(values, cb);
                }


            });

        },

        takedown: function(cb) {
            this.$super(cb);
            test.done();
        }

    });

    agent('CL')
        ('pause')()
        ('push', 1)()
        ('push', 3)()
        ('reset')()
        ('push', 2)()
        ;

};

exports['Ontology'] = function(test) {
    test.expect(4);

    agent('@passive', 'CJ', {

        red: 'http://colours/red1',
        green: 'http://colours/green1',
        blue: 'http://colours/blue1',

        method: function(a, $cb) {

            test.ok(a.red === '#FF0000', 'a.red === \'#FF0000\'');
            test.ok(a.green === '#00FF00', 'a.green === \'#00FF00\'');
            test.ok(a.blue === '#0000FF', 'a.blue === \'#0000FF\'');
            test.ok(
                a['http://colours/blue2'] === '#0000FE', 
                'a[\'http://colours/blue2\'] === \'#0000FE\''
            );

            $cb();

            test.done();
        }

    });

    var message = {

        '@context': {
            red1: 'http://colours/red1',
            green1: 'http://colours/green1',
            blue1: 'http://colours/blue1',
            blue2: 'http://colours/blue2'
        },

        red1: '#FF0000',
        green1: '#00FF00',
        blue1: '#0000FF',
        blue2: '#0000FE'

    };

    agent('CJ')('method', message)();

};

exports['Ontology @context'] = function(test) {
    test.expect(12);

    agent('@passive', 'CK', {

        '@context': {
            red: 'http://colours/red1',
            green: 'http://colours/green1',
            blue: 'http://colours/blue1'
        },

        method: function(a, b, c, d, e, f, g, $cb) {

            test.ok(a.red === '#FF0000', 'a.red === \'#FF0000\'');
            test.ok(a.green === '#00FF00', 'a.green === \'#00FF00\'');
            
            test.ok(b.blue === '#0000FF', 'b.blue === \'#0000FF\'');
            test.ok(
                b['http://colours/blue2'] === '#0000FE', 
                'b[\'http://colours/blue2\'] === \'#0000FE\''
            );

            test.ok(c.name === 'messageC', 'c.name === \'messageC\'');
            test.ok(c.red1 === '#FF0000', 'c.red1 === \'#FF0000\'');

            test.ok(
                typeof d[0]['@context'] === 'object', 
                'typeof d[0][\'@context\'] === \'object\''
            );
            test.ok(d[0].red1 === '#FF0000', 'd[0][\'red1\'] === \'#FF0000\'');
            test.ok(d[0].green1 === '#00FF00', 'd[0][\'green1\'] === \'#00FF00\'');

            test.ok(e === '1', 'e === \'1\'');

            test.ok(f === true, 'f === true');

            test.ok(g === undefined, 'g === undefined');

            $cb();

            test.done();
        }

    });

    var context = {
            red1: 'http://colours/red1',
            green1: 'http://colours/green1',
            blue1: 'http://colours/blue1',
            blue2: 'http://colours/blue2'
        },
        messageA = {
            '@context': context,
            red1: '#FF0000',
            green1: '#00FF00'
        },
        messageB = {
            '@context': context,
            blue1: '#0000FF',
            blue2: '#0000FE'
        },
        messageC = {
            name: 'messageC',
            red1: '#FF0000'
        }
        ;

    agent('CK')('method', messageA, messageB, messageC, [messageA], '1', true, undefined)();

};

exports['Ontology MapReduce'] = function(test) {
    test.expect(1);

    agent({

        setup: function(cb) {
            this.$super(cb);

            this.addBehaviour('CM extends MapReduce', '@flow map', {

                fullName: 'http://schema.org/name',

                map: function(person, $cb) {

                    this.write(person.fullName, person);

                    $cb();

                },

                reduce: function(persons, cb) {

                    test.ok(persons.length === 3, 'persons.length === 3');

                    this.end('map');

                    this.$super(persons, cb);
                }

            });

        },

        takedown: function(cb) {
            this.$super(cb);
            test.done();
        }

    });

    var persons = [
        {
            '@context': 'http://schema.org/',
            '@type': 'Person',
            'name': 'Jane Doe',
            'jobTitle': 'Professor',
            'telephone': '(425) 123-4567',
            'url': 'http://www.janedoe.com'
        },
        {
            '@context': 'http://schema.org/',
            '@type': 'Person',
            'name': 'Jane Doe',
            'jobTitle': 'Professor',
            'telephone': '(425) 123-4567',
            'url': 'http://www.janedoe.com'
        },
        {
            '@context': 'http://schema.org/',
            '@type': 'Person',
            'name': 'Jane Doe',
            'jobTitle': 'Professor',
            'telephone': '(425) 123-4567',
            'url': 'http://www.janedoe.com'
        }
    ];

    agent('CM')('push', persons)();

};

exports['Inline'] = function(test) {
    test.expect(15);

    var i = 0;

    agent('@passive', 'CN', {

        method1: function($cb) {

            test.ok(true, 'method1');

            $cb('onComplete')();

        },

        method2: function(a, $cb) {

            test.ok(true, 'method2');
            test.ok(a === 'a', 'a === \'a\'');

            $cb('onError')();

        },

        method3: function($cb) {

            test.ok(true, 'method3');

            $cb('onComplete', 'b')();

        }

    });

    agent('CN')
        ('^onComplete', function($cb) {

            i++;

            test.ok(true, '^onComplete');

            test.ok(i <= 3, 'i <= 3');
            
            $cb();

        })
        ('^onError', function($cb) {

            test.ok(true, '^onError');

            $cb();

        })
        ('method1')()
        ('method1')()
        ('method1')()
        ('method2', 'a')()
        ('^onComplete', function(b, $cb) {

            test.ok(true, '^onComplete');
            test.ok(b === 'b', 'b === \'b\'');

            $cb();

            test.done();

        })
        ('method3')()
        ;

};

exports['NoWrite MapReduce'] = function(test) {
    test.expect(1);

    agent({

        setup: function(cb) {
            this.$super(cb);

            this.addBehaviour('CM extends MapReduce', '@flow map', {

                map: function(value, $cb) {

                    test.ok(true, 'map');

                    $cb();

                    test.done();

                },

                reduce: function(values, cb) {

                    test.ok(false, 'reduce');

                    this.$super(values, cb);

                }

            });

        }

    });

    agent('CM')('push', 1)();

};
