'use strict';

var agent = $thing.agent;

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

exports['Description get'] = function(test) {
    test.expect(1);

    agent(
        'http://www.test.com/ct/', 
        '@passive',
        '@author The Author', 
        '@description The Desc', 
        '@tag tag1 tag2', {

        'schema': 'http://schema.org/',

        'property a': {
            value: 'a'
        },

        'property b': {
            value: 'b',
            writable: true
        },

        '  property   c  ': {

            '@type': 'schema:c',

            get: function() {
                return this.valueOfC;
            },

            set: function(v) {
                this.valueOfC = v;
            }

        },

        setup: function(cb) {
            this.$super(cb);

            this.addBehaviour(
                'http://www.test.com/cu/ extends Queue implements Action', 
                '@tag actionTag', {

                    'property d': {
                        '@type': 'schema:d',
                        value: 'd',
                        writable: true
                    }

                }
            );

            this.addBehaviour(
                'http://www.test.com/cv/ extends Queue implements Event', 
                '@tag eventTag'
            );

            this.addBehaviour(
                'cw extends Queue implements Event', 
                '@tag non-iri non-curie and hidden'
            );

        }


    });

    agent('@select Description http://www.test.com/ct/')
        ('get')({

            'sch': 'http://schema.org/',

            'ct': 'http://www.test.com/ct/',
            'cu': 'http://www.test.com/cu/',
            'cv': 'http://www.test.com/cv/',
 
            data: function(data, $cb) {

                test.deepEqual(
                    data, {

                        '@id': 'ct:agent',
                        '@type': 'wot:thing',

                        'wot:author': ['The Author'],
                        'wot:description': ['The Desc'],
                        'wot:tag': ['tag1', 'tag2'],

                        '@graph': [ 
                            
                            { '@id': 'ct:a', '@type': 'wot:property', 'wot:writable': false },
                            
                            { '@id': 'ct:b', '@type': 'wot:property', 'wot:writable': true },
                            
                            { '@id': 'ct:c', '@type': 'sch:c', 'wot:writable': true },
                            
                            { '@id': 'cu:d', '@type': 'sch:d', 'wot:writable': true },
                            
                            { 
                                '@id': 'cu:behaviour', 
                                '@type': 'wot:action', 
                                'wot:tag': ['actionTag'] 
                            },
                            
                            { 
                                '@id': 'cv:behaviour', 
                                '@type': 'wot:event', 
                                'wot:tag': ['eventTag'] 
                            }

                        ]

                    }
                );

                $cb();

                test.done();

            }

        })
        ;

};