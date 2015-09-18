'use strict';

var agent = $thing.agent;

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

            error: function(err) {
                test.ok(false, 'error');
                
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

            error: function(err) {
                test.ok(false, 'error');
                
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