'use strict';

var agent = $thing.agent;

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