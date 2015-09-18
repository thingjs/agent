'use strict';

var agent = $thing.agent;

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