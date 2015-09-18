'use strict';

var agent = $thing.agent;

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

exports['Complete'] = function(test) {
    test.expect(1);
    agent('BB or Complete')
        ('method')({
            complete: function($cb) {
                test.ok(true, 'complete');
                test.done();
                $cb();
            }
        });
};

exports['Error'] = function(test) {
    test.expect(1);
    agent('BB or Error')
        ('method')({
            error: function(err, $cb) {
                test.ok(true, 'error');
                test.done();
                $cb();
            }
        });
};

exports['filters'] = function(test) {
    test.expect(11);

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
        .closest('method')()
        .furthest('method')()
        .oldest('method')()
        .newest('method')()
        .all('method')()
        ('method')()
        ('done')()
        ;

};

exports['Oldest/Newest Filters'] = function(test) {
    test.expect(3);

    var c = 0;

    agent(
        '@passive', 
        'implements CCA', {

            method: function($cb) {
                
                if (++c === 2)
                    test.ok(true, 'method');
                else
                    test.ok(false, 'method');

                $cb();
            }

        }
    );

    agent(
        '@passive', 
        'implements CCA', {

            method: function($cb) {
                
                test.ok(false, 'method');

                $cb();
            }

        }
    );

    agent(
        '@passive', 
        'implements CCA', {

            method: function($cb) {

                if (++c === 1)
                    test.ok(true, 'method');
                else
                    test.ok(false, 'method');

                $cb();
            },

            done: function($cb) {
                test.ok(true, 'done');
                test.done();
                $cb();
            }

        }
    );

    agent('@select CCA')
        .newest('method')()
        .oldest('method')()
        ('done')()
        ;

};

exports['Closest/Furthest Filters'] = function(test) {
    test.expect(1);

    var a = 0,
        b = 0,
        c = 0
        ;

    agent(
        '@passive', 
        'implements CCB', {

            method: function($cb) {
                
                a++;

                $cb();
            }

        }
    );

    agent(
        '@passive', 
        'implements CCB', {

            method: function($cb) {
                
                b++;

                $cb();
            }

        }
    );

    agent(
        '@passive', 
        'implements CCB', {

            method: function($cb) {
                
                c++;

                $cb();
            },

            done: function($cb) {

                if (a === 2)
                    test.ok((b === 1 && c === 0) || (c === 1 && b === 0), 'done a === 2');
                else if (b === 2)
                   test.ok((a === 1 && c === 0) || (c === 1 && a === 0), 'done b === 2');
                else if (c === 2)
                   test.ok((a === 1 && b === 0) || (b === 1 && a === 0), 'done b === 2');
                else
                    test.ok(false, 'done');

                test.done();

                $cb();
            }

        }
    );

    agent('@select CCB')
        .closest('method')()
        .closest('method')()
        .furthest('method')()
        ('done')()
        ;

};

exports['Inline'] = function(test) {
    test.expect(17);

    var i = 0,
        j = 0
        ;

    agent('@passive', 'CN', {

        method1: function($cb) {

            test.ok(true, 'method1');

            $cb('complete')();

        },

        method2: function(a, $cb) {

            test.ok(true, 'method2');
            test.ok(a === 'a', 'a === \'a\'');

            $cb('error')();

        },

        method3: function($cb) {

            test.ok(true, 'method3');

            $cb('complete', 'b')();

        }

    });

    agent('CN')
        ('^complete', function($cb) {

            i++;

            test.ok(true, '^complete');

            test.ok(i <= 3, 'i <= 3');
            
            $cb();

        })
        ('^error', function($cb) {

            test.ok(true, '^error');

            $cb();

        })
        ('method1')()
        ('method1')()
        ('method1')()
        ('^complete', function($cb) {

            test.ok(true, '^complete');
            test.ok(++j === 1, '++j === 1');

            $cb();

        })
        ('method2', 'a')()
        ('^complete', function(b, $cb) {

            test.ok(true, '^complete');
            test.ok(b === 'b', 'b === \'b\'');

            this.$super($cb);

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

exports['xorDistance'] = function(test) {
    test.expect(5);
    
    test.ok(
        $thing.xorDistance('abcdef', 'abcdef') === 0, 
        '$thing.xorDistance(\'abcdef\', \'abcdef\')'
    );

    test.ok(
        $thing.xorDistance('abcdef', 'bbcdef') === 83, 
        '$thing.xorDistance(\'abcdef\', \'bbcdef\')'
    );

    test.ok(
        $thing.xorDistance('bbcdef', 'abcdef') === 83, 
        '$thing.xorDistance( \'bbcdef\', \'abcdef\')'
    );

    test.ok(
        $thing.xorDistance('abcdef', 'abc') === 89, 
        '$thing.xorDistance(\'abcdef\', \'abc\')'
    );

    test.ok(
        $thing.xorDistance('abc', 'abcdef') === 89, 
        '$thing.xorDistance(\'abc\', \'abcdef\')'
    );

    test.done();
};

exports['General Exceptions'] = function(test) {
    test.expect(2);

    var i = 0;

    agent('@passive', 'CO', {

        method: function($cb) {

            if (++i === 1) throw('error');
            else $cb('complete')();

        }

    });

    agent('CO')
        ('^error', function(err, $cb) {

            test.ok(err === 'error', 'err === \'error\'');

            $cb();

        })
        ('^complete', function($cb) {

            test.ok(i === 2, 'i === 2');
           
            $cb();

            test.done();

        })
        ('method')()
        ('method')()
        ;

};