'use strict';

var agent = $thing.agent;

exports['Properties'] = function(test) {
    test.expect(11);

    agent('@passive', 'CP', {

        'property a': {
            value: 'a'
        },

        'property b': {
            value: 'b',
            writable: true
        },

        'property c': {

            get: function() {                
                return this.valueOfC;
            },

            set: function(v) {
                this.valueOfC = v;
            }

        },

        'property d': {

            get: function() {                
                return 'd';
            }

        },

        setup: function(cb) {
            this.$super(cb);

            var cq = this.addBehaviour('@passive', 'CQ', {

                'property e': {

                    set: function(v) {

                        test.ok(
                            this.$owner.valueOfC === 'c', 
                            'this.$owner.valueOfC === \'c\''
                        );

                        this.$owner.valueOfE = v;

                    },

                    get: function() {

                        return this.$owner.valueOfE;

                    }

                },

                method: function($cb) {

                    this.e = 'e';

                    test.ok(this.e === 'e', 'this.e === \'e\'');

                    $cb();
                }

            });

            test.ok(this.a === 'a', 'this.a === \'a\'');
            test.ok(this.b === 'b', 'this.a === \'b\'');
            test.ok(this.c === undefined, 'this.c === undefined');
            test.ok(this.d === 'd', 'this.d === \'d\'');

            try {

                this.a = 1;
            
                test.ok(false, 'this.a = 1');

            }
            catch(e) {

                test.ok(true, 'this.a = 1');

            }

            try {

                this.b = 1;
            
                test.ok(true, 'this.b = 1');

            }
            catch(e) {

                test.ok(false, 'this.b = 1');

            }

            try {

                this.c = 'c';
            
                test.ok(true, 'this.c = \'c\'');
                test.ok(this.c === 'c', 'this.c === \'c\'');

            }
            catch(e) {

                test.ok(false, 'this.c = \'c\'');

            }

            try {

                this.d = 1;
            
                test.ok(false, 'this.d = 1');

            }
            catch(e) {

                test.ok(true, 'this.d = 1');

            }

            agent(cq)('method')();

            test.done();

        }

    });

}; 

exports['Properties put'] = function(test) {
    test.expect(8);

    agent('@passive', 'http://www.test.com/cr/', {

        'sch': 'http://schema.org/',

        'property a': {
            value: 'a'
        },

        'property b': {
            '@type': 'sch:b',
            writable: true,
            value: 'b',
        },

        'property c': {

            get: function() {
                return this.valueOfC;
            },

            set: function(v) {
                this.valueOfC = v;
            }

        },

        setup: function(cb) {
            this.$super(cb);

            this.addBehaviour('@passive', 'http://www.test.com/cr/cs/', {

                'property d': {
                    value: 'd'
                },

                'property e': {
                    '@type': 'sch:e',
                    writable: true,
                    value: 'e'
                }

            });

        }

    });

    agent('@select Properties http://www.test.com/cr/')
        
        ('^complete', function($cb) {

            agent('@select Properties http://www.test.com/cr/')
                ('get')({

                    'schema': 'http://schema.org/',

                    'cr': 'http://www.test.com/cr/',
                    'cs': 'cr:cs/',

                    'cr:b': {
                        '@type': 'schema:b'
                    },

                    'cs:e': {
                        '@type': 'schema:e'
                    },

                    error: function(err, $cb) {

                        test.ok(false, err);

                        $cb();

                        test.done();

                    },

                    data: function(data, $cb) {

                        test.ok(data['cr:a'] === 'a', '(data[\'cr:a\'] === \'a\'');
                        test.ok(data['cr:b'] === 2, '(data[\'cr:b\'] === 2');
                        test.ok(data['cr:c'] === 3, '(data[\'cr:c\'] === 3');
                        test.ok(data['cs:d'] === 'd', '(data[\'cs:d\'] === \'d\'');
                        test.ok(data['cs:e'] === 4, '(data[\'cs:e\'] === 4');

                        $cb();

                        test.done();

                    }

                })
                ;
                
            $cb();
        
        })

        ('^error', function(err, $cb) {
            
            test.ok(true, err);

            $cb();
        
        })

        ('put', {

            // not writable

            'http://www.test.com/cr/a': 'x' 

        })()

        ('put', {

            // missing properties

            'http://www.test.com/cr/b': {
                '@type': 'http://schema.org/b',
                '@value': 'x'
            }

        })()

        ('put', {

            'http://www.test.com/cr/b': {
                '@type': 'http://schema.org/b',
                '@value': 'x'
            },

            'http://www.test.com/cr/c': 'x',

            // type mismatch

            'http://www.test.com/cr/cs/e': {
                '@type': 'http://schema.org/x',
                '@value': 'x'                
            }

        })()

        ('^error', function(err, $cb) {

            test.ok(false, err);

            $cb();

            test.done();
        
        })

        ('put', {
            '@context': {
                'schema': 'http://schema.org/',
                'cr': 'http://www.test.com/cr/',
                'cr:b': {
                    '@type': 'schema:b'
                },
                'cr:cs/e': {
                    '@type': 'schema:e'
                }
            },
            'cr:b': 2,
            'cr:c': 3,
            'cr:cs/e': 4
        })()

        ;

};

exports['Properties patch'] = function(test) {
    test.expect(7);

    agent('@passive', 'http://www.test.com/da/', {

        'sch': 'http://schema.org/',

        'property a': {
            value: 'a'
        },

        'property b': {
            '@type': 'sch:b',
            writable: true,
            value: 'b',
        },

        'property c': {

            get: function() {
                return this.valueOfC;
            },

            set: function(v) {
                this.valueOfC = v;
            }

        },

        setup: function(cb) {
            this.$super(cb);

            this.addBehaviour('@passive', 'http://www.test.com/da/db/', {

                'property d': {
                    value: 'd'
                },

                'property e': {
                    '@type': 'sch:e',
                    writable: true,
                    value: 'e'
                }

            });

        }

    });

    agent('@select Properties http://www.test.com/da/')
        
        ('^complete', function($cb) {

            agent('@select Properties http://www.test.com/da/')
                ('get')({

                    'schema': 'http://schema.org/',

                    'da': 'http://www.test.com/da/',
                    'db': 'da:db/',

                    'da:b': {
                        '@type': 'schema:b'
                    },

                    'db:e': {
                        '@type': 'schema:e'
                    },

                    error: function(err, $cb) {

                        test.ok(false, err);

                        $cb();

                        test.done();

                    },

                    data: function(data, $cb) {

                        test.ok(data['da:a'] === 'a', '(data[\'da:a\'] === \'a\'');
                        test.ok(data['da:b'] === 'b', '(data[\'da:b\'] === \'b\'');
                        test.ok(data['da:c'] === 3, '(data[\'da:c\'] === 3');
                        test.ok(data['db:d'] === 'd', '(data[\'db:d\'] === \'d\'');
                        test.ok(data['db:e'] === 4, '(data[\'db:e\'] === 4');

                        $cb();

                        test.done();

                    }

                })
                ;
                
            $cb();
        
        })

        ('^error', function(err, $cb) {
                
            test.ok(true, err);

            $cb();
        
        })

        ('patch', {

            // not writable

            'http://www.test.com/da/a': 'x' 

        })()

        ('patch', {

            'http://www.test.com/da/b': {
                '@type': 'http://schema.org/b',
                '@value': 'x'
            },

            'http://www.test.com/da/c': 'x',

            // type mismatch

            'http://www.test.com/da/db/e': {
                '@type': 'http://schema.org/x',
                '@value': 'x'                
            }

        })()

        ('^error', function(err, $cb) {

            test.ok(false, err);

            $cb();

            test.done();
        
        })

        ('patch', {
            '@context': {
                'schema': 'http://schema.org/',
                'da': 'http://www.test.com/da/',
                'da:b': {
                    '@type': 'schema:b'
                },
                'da:db/e': {
                    '@type': 'schema:e'
                }
            },
            // exclude b
            'da:c': 3,
            'da:db/e': 4
        })()

        ;

};