/*
Copyright (c) 2015 Simon Cullen, http://github.com/cullens

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/
'use strict';

if (!$thing.usePaho)
    var mqtt = require('mqtt');

$thing.agent('abstract Mqtt implements Container', {

    setup: function(cb) {
        this.$super(cb);

        if ($thing.usePaho)
            this.port = 80;
        else
            this.port = 1883;

        this.reconnectPeriod = 1000;

        this.isConnecting = false;
        this.isConnected = false;

        this.actuatorsTotal = 0;

        this.topicRefs = {};
        this.pendingSubs = {};
        this.pendingUnsubs = {};

        var z = -1,
            self = this
            ;

        $thing.searchMeta(this, 'host', 'string', function(value) {
            self.host = value;
        });

        $thing.searchMeta(this, 'port', 'int', function(value) {
            self.port = value;
        });

        $thing.searchMeta(this, 'clientId', 'string', function(value) {
            self.clientId = value;
        });

        $thing.searchMeta(this, 'reconnectPeriod', 'int', function(value) {
            self.reconnectPeriod = value;
        });

        if (this.host === undefined)
            throw new Error('Mqtt: Missing @host');
 
        if (this.clientId === undefined)
            this.clientId = 'xxxxxxxx-xxxx-4xxz-yzzz-zzzzzzzzzzzz'.replace(
                /[xyz4-]/g, 
                function(c) {
                    switch(c) {
                        case 'x':
                            return (
                                Math.floor(Math.random() * 100) % 16
                            ).toString(16);
                        case 'y':
                            return '8';
                        case 'z':
                            return self.$id.charAt(++z);
                        case '-':
                        case '4':
                            return c;
                    }
                }
            );

    },
    
    destroy: function($cb) {
        this.getChildren().forEach(function(child) {
            if (!child.isAbstract())
                if (child.matchInterface('Sensor') !== undefined ||
                    child.matchInterface('Actuator') !== undefined
                )
                    child.$owner.removeBehaviour(child);
        });

        $cb();
    },

    addBehaviour: function() {
        var doConnect = false,
            obj = this.$super.apply(this, arguments)
            ;
        
        if (obj !== undefined && !obj.isAbstract()) {
 
            if (obj.matchInterface('Sensor') !== undefined) {
                obj.$subTopic = obj.getName();

            if (this.topicRefs[obj.$subTopic] !== undefined)
                this.topicRefs[obj.$subTopic]++;
            else {
                this.topicRefs[obj.$subTopic] = 1;

                if (this.isConnected)
                    this.doSubscribe(obj.$subTopic);
                else {
                    this.pendingSubs[obj.$subTopic] = true;

                    if (this.pendingUnsubs[obj.$subTopic] !== undefined)
                        delete this.pendingUnsubs[obj.$subTopic];

                        doConnect = true;
                    }
                }
            }
                
            if (obj.matchInterface('Actuator') !== undefined) {
                var flow = obj.getFlow();

                obj.$pubTopic = obj.getName();

                obj.getFlow = function() {

                    return $thing.arrayAppend(
                        flow,
                        function(message, cb) {

                            obj.$owner.doSendMessage(obj.$pubTopic, message);
                            
                            cb();
                        }
                    );

                };
                
                if (!this.isConnected) {

                    doConnect = true;

                    $thing.agent(obj)('pause')();

                }

                this.actuatorsTotal++;
            }
            
            if (doConnect)
                this.doConnect();

        }
            
        return obj;
    },

    removeBehaviour: function() {
        var self = this,
            objs = this.$super.apply(this, arguments)
            ;
            
        objs.forEach(function(obj) {

            if (obj.$subTopic !== undefined)
                if (--self.topicRefs[obj.$subTopic] <= 0) {
                    delete self.topicRefs[obj.$subTopic];

                    if (self.pendingSubs[obj.$subTopic] !== undefined)
                        delete self.pendingSubs[obj.$subTopic];

                    if (self.isConnected)
                        self.doUnsubscribe(obj.$subTopic);
                    else
                        self.pendingUnsubs[obj.$subTopic] = true;
                }
                
            if (obj.$pubTopic !== undefined)
                self.actuatorsTotal--;

        });

        if (!this.isActive())
            this.doDisconnect();

        return objs;
    },

    doConnectWithMqtt: function() {
        var self = this;

        this.client = mqtt.connect({
            host: this.host,
            port: this.port,
            clientId: this.clientId,
            reconnectPeriod: this.reconnectPeriod
        });

        this.client.on('error', function(err) {
            self.onError(err)();
        });

        this.client.on('close', function() {
            self.onDisconnect();
            self.removeBehaviour(self.broker);
            delete self.broker;
        });

        this.client.on('connect', function() {
            self.broker = self.addBehaviour('@passive', {});
            self.onConnect();
        });

        this.client.on('message', function(topic, message) {
            self.onMessageArrived(
                topic, 
                $thing.createBuffer(message)
            );
        });

    },

    doConnectWithPaho: function() {
        var self = this;

        this.client = new Paho.MQTT.Client(
            this.host, 
            this.port, 
            this.clientId
        );

        this.client.onConnectionLost = function() {
            self.onDisconnect();
        };
                    
        this.client.onMessageArrived = function(msg) {
            self.onMessageArrived(
                msg.destinationName, 
                $thing.createBuffer(msg.payloadBytes)
            );
        };
            
        this.client.onMessageDelivered = function(msg) {
            self.onMessageDelivered(
                msg.destinationName, 
                $thing.createBuffer(msg.payloadBytes)
            );
        };

        this.client.connect({
            onSuccess: function() {
                self.onConnect();
            },
            onFailure: function(err) {
                self.onError(err);
            }
        });
    },

    isActive: function() {
        for (var i in this.pendingSubs)
            break;        
        for (var j in this.pendingUnsubs)
            break;
        for (var k in this.topicRefs)
            break;
        if (    i !== undefined || 
                j !== undefined || 
                k !== undefined || 
                this.actuatorsTotal > 0
        )  
            return true;
        else
            return false;
    },

    doConnect: function() {
        if (this.isConnecting) 
            return;

        this.isConnecting = true;
        this.isConnected = false;

        if ($thing.usePaho)
            this.doConnectWithPaho();
        else
            this.doConnectWithMqtt();
    },

    doDisconnect: function() {
        if (this.client !== undefined) {

            this.isConnecting = false;
            this.isConnected = false;

            if ($thing.usePaho)
                this.client.disconnect();
            else
                this.client.end();

            delete this.client;
        }
    },

    doReconnect: function() {
        if ($thing.usePaho)
            this.addBehaviour(
                '@singleton',
                '@period $', this.reconnectPeriod,
                'extends Waker', {
                    wake: function(cb) {
                        this.$super(cb);

                        if (this.$owner.isConnected)
                            this.$owner.doDisconnect();
                        else
                            this.$owner.doConnect();
                    }
                }
            );
    },

    doSubscribe: function(topic) {
        this.client.subscribe(topic);
    },

    doUnsubscribe: function(topic) {
        this.client.unsubscribe(topic);
    },

    doSendMessage: function(topic, message) {
        var self = this;

        if ($thing.usePaho)
            this.client.send(topic, message, 0, false);
        else 
            this.client.publish(
                topic,
                message, {

                },
                function(err) {
                    if (err) 
                        self.onError(err);
                    else 
                        self.onMessageDelivered(
                            topic, 
                            $thing.createBuffer(message)
                        );
                }
            );
    },

    onError: function(err) {
        this.isConnecting = false;

        if ($thing.usePaho && err.errorCode === 8)
            this.onDisconnect();
    },

    onConnect: function() {
        this.isConnecting = false;
        this.isConnected = true;

        for (var i in this.pendingSubs)
            this.doSubscribe(i);

        for (var j in this.pendingUnsubs)
            this.doUnsubscribe(j);

        this.pendingSubs = {};
        this.pendingUnsubs = {};

        for (var k in this.topicRefs)
            break;

        if (k === undefined && this.actuatorsTotal <= 0) 
            this.doDisconnect();
        else
            this.getChildren().forEach(function(obj) {

                if (!obj.isAbstract() && 
                    obj.matchInterface('Actuator') !== undefined
                )       
                    $thing.agent(obj)('resume')();

            });
    },

    onDisconnect: function() {
        this.isConnecting = false;
        this.isConnected = false;

        if (this.actuatorsTotal > 0)
            this.getChildren().forEach(function(obj) {
                if (obj.matchInterface('Actuator') !== undefined)
                    $thing.agent(obj)('pause')();
            });

        if (this.isActive())
            this.doReconnect();
    },

    onMessageArrived: function(topic, message) {

        this.getChildren().forEach(function(obj) {

            if (!obj.isAbstract() && obj.matchInterface(topic) !== undefined)
                    
                if (obj.matchInterface('Bridge') !== undefined)
                    $thing.agent('@select $ not owner:$', topic, obj.$owner.$id)
                        ('push', message)()
                        ;

                else if (obj.matchInterface('Sensor') !== undefined)
                    $thing.agent(obj)
                        ('push', message)()
                        ;

        });
        
    },

    onMessageDelivered: function(topic, message) {

    }

});