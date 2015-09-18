'use strict';

if ($thing.bootstrap === 'node.js') 
    var contextify = require('contextify');

var agent = $thing.agent;

exports['container'] = function(test) {
    test.expect(1);

    agent('@passive', 'CD', {});
    agent('extends CD');

    $thing.$container(function(agent) {

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

        $thing.$container(function(agent) {
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