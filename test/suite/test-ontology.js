'use strict';

var agent = $thing.agent;

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

            test.ok(c.name === undefined, 'c.name === undefined');
            test.ok(c.red === '#FF0000', 'c.red === \'#FF0000\'');

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
            'http://colours/red1': '#FF0000'
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