![thing.js: Internet of Wild Things](https://thingjs.github.io/cdn/images/thingjs-header-850-blue.png)

[![Build Status](https://travis-ci.org/thingjs/agent.svg?branch=master)](https://travis-ci.org/thingjs/agent)

Thing.js is an Agent Framework written in JavaScript for building Internet of Things applications. The Framework supports Node.js, Browsers (ES5+, Chrome, Safari, Firefox, Opera), Tessel 2, Phonegap/Cordova, JavaScriptCore and other Mobile Containers.

## Features

- Abstractions, Inheritance and Interfaces
- Properties, Annotations and Templates
- Passivity and Singletons
- Simple, Series, Parallel, Queue, MapReduce and Waker Primitive Behaviours
- HRRN Scheduling, Micro-containers and Auditing
- Asynchronous Messaging, Selectors and Filters
- JSON-LD Ontologies and Message Translation
- WoT Descriptions and Actions
- MQTT Sensors, Actuators and Bridging

## Installation
##### In the Browser
```html
<script type="text/javascript" src="https://thingjs.github.io/cdn/lib/thingjs-agent-0.2.3-full.min.js"></script>
```
##### Node.js
```sh
npm install thingjs-agent
```
```javascript
var agent = require('thingjs-agent');
```

## Quick Example
```javascript
agent('abstract smith', {
    setup: function(cb) {
        this.$super(cb);
        
        this.quote = "As you can see, we've had our eye on you for some time now, Mr. Anderson.";

        this.addBehaviour('@passive', 'search', {
            forNeo: function($cb) {
                $cb('found', this.$owner.quote)();
            }
        });
    }
});

agent('extends smith');
agent('extends smith');
agent('extends smith');

agent('search')
    ('^found', function(quote, $cb) {
        console.log(quote);
        $cb();
    })
    ('forNeo')()
    ;
// Outputs: "As you can see, we've had our eye on you for some time now, Mr. Anderson."
//          "As you can see, we've had our eye on you for some time now, Mr. Anderson."
//          "As you can see, we've had our eye on you for some time now, Mr. Anderson."
```

---

## Usage

### Declarations
##### Agent Declaration
```javascript
agent('MyObject', { 
    // Creates an Agent called MyObject
    
});
```
##### Behaviour Declaration
```javascript
agent('MyAgent', {
    setup: function(cb) {
        this.$super(cb);
        
        this.addBehaviour('MyObject', {
            // Creates a Behaviour called MyObject
            
        });
    }
});
```

### Anonymous Declaration
```javascript
({ // Nameless Agent or Behaviour

})
```

### Abstraction
```javascript
('abstract MyObject', { // Agent or Behaviour
    // Abstraction called MyObject
    
})
```

### Properties
```javascript
agent({
    
    // Properties can be defined in Agents or Behaviours
    
    'property testPropertyA': { 
    
        // JSON-LD type (optional)
    
        '@type': 'http://test.com/type', 
    
        value: 'propertyValueA'
    
    },
    
    'property testPropertyB': {
    
        set: function(value) {
        
            this.testPropertyValueB = value;
        
        
        },
        
        get: function() {
        
            return this.testPropertyValueB;
        
        }
        
    },
    
    setup: function(cb) {
        this.$super(cb);    
    
        console.log(this.testPropertyA);
        
        // outputs: 'propertyValueA'
        
        console.log(this.testPropertyB);
        
        // outputs: undefined
        
        this.testPropertyB = 'testValueB';
        
        console.log(this.testPropertyB);
        
        // outputs: 'testValueB'
    
    }

})
```

### Methods
```javascript
('MyObject', { // Agent or Behaviour

    exampleMethodA: function() { 
        // Empty Method
    },
    exampleMethodB: function() { 
        // Another Empty Method
    }
})
```

### Ontology Terms
```javascript
('MyObject', { // Agent or Behaviour

    // JSON-LD Context

    name: 'http://schema.org/name', // Term
    
    url: 'https://schema.org/url' // Another Term

})
```

```javascript
('MyObject', { // Agent or Behaviour

    '@context': { // JSON-LD Context
    
        name: 'http://schema.org/name', // Term
    
        url: 'https://schema.org/url' // Another Term
    
    }

})
```

### Inheritance
```javascript
('MyBaseObject', { // Agent or Behaviour

    exampleMethod: function() {
    
    }
})

('MyObject extends MyBaseObject', { // Agent or Behaviour
    // MyObject inherits Methods and Properties from MyBaseObject
    
    exampleMethod: function() {
        this.$super(); // Call exampleMethod in MyBaseObject
    }
})
```

### Agent Constructor and Destructor
```javascript
agent('MyObject', {

    setup: function(cb) { // Constructor
        this.$super(cb);
        // Init
        
    },
    takedown: function(cb) { // Destructor
        // Cleanup
        
        this.$super(cb); 
    }
});
```

### Annotations
```javascript
(   '@example annotation', // Declare Annotation
    '@annotation +', 'spanning +', 'multiple decorations', 
        // Concat decorations with + operator
    'MyObject', { // Agent or Behaviour
    
        exampleMethod: function() {
            console.log(
                this.getMeta() // Get Annotations
            );
            // outputs: [
            //  'example annotation',
            //  'annotation spanning multiple decorations'
            // ]
        }
    }
)
```

### Templates
```javascript
var string = 'annotation',
    nameSuffix = 'Object'
    ;

(   '@example $', string, // Substitue $ for string
    '@$ +', string, 'spanning +', 'multiple decorations',
        // Substitue $ for string
    '@the meaning of life is $(meaningOfLife)', 42 
        // Substitue $(meaningOfLife) for 42 and 
        // Set this.$meaningOfLife = 42
    'My$', nameSuffix, { 
        // Add nameSuffix to the Name of the Agent or Behaviour
        
        setup: function(cb) {
            this.$super(cb)
            
            console.log(
                this.getMeta() // Get Annotations
            );
            // outputs: [
            //  'example annotation',
            //  'annotation spanning multiple decorations',
            //  'the meaning of life is 42'
            // ]
            
            console.log( this.getName() );
            // outputs: 'MyObject'
            
            console.log( this.$meaningOfLife );
            // outputs: 42
 
        }
    }
)
```

### Messaging
```javascript
('MyObject', { // Agent or Behaviour

    exampleMethod: function($cb) { 
        // Method with Callback Object Argument $cb
        
        console.log('exampleMethod');
        
        $cb(); // Callback
    }
})

agent('MyObject') // Select Agent(s) and Behaviour(s)
    ('exampleMethod') // Call exampleMethod
    () // with Empty Callback Object
    ;
// Outputs: 'exampleMethod'

agent('MyUndefinedObject') // MyUndefinedObject doesn't exist
    ('exampleMethod')() 
    ;
// No Output

agent('MyObject') 
    ('exampleMethod', 42)() // Call exampleMethod with 1 Argument
    ;
// No Output

agent('MyObject') 
    ('exampleMethod')() // Stack Multiple Calls
    ('exampleMethod')() 
    ('exampleMethod')() 
    ;
// Outputs: 'exampleMethod'
//          'exampleMethod'
//          'exampleMethod'
```
```javascript
('MyObject', { // Agent or Behaviour

    exampleMethod: function(meaningOfLife, $cb) { 
        // Method with meaningOfLife Argument 
        // and Callback Object Argument $cb
        
        console.log('exampleMethod');
        console.log(meaningOfLife);
        
        $cb('callbackMethod') // Call callbackMethod in $cb
            () // with an Empty Callback Object
            ; 
    }
})

agent('MyObject') 
    ('exampleMethod', 42)({ 
        // Callback Object created from Agent Declaration 
        
        // Callback Objects may be Agent Declarations, 
        // Instances or Selectors
        
        callbackMethod: function($cb) {
            console.log('callbackMethod');
            $cb();
        }
    })
    ;
// Outputs: 'exampleMethod'
//           42
//          'callbackMethod'
```
```javascript
('MyObject', { // Agent or Behaviour

    exampleMethod: function(meaningOfLife, $cb) { 
        
        console.log('exampleMethod');
        console.log(meaningOfLife);
        
        $cb('callbackMethod')(); 
    }
})

agent('MyObject')
    ('^callbackMethod', function($cb) { 
    // The ^ operator defines an inline method called callbackMethod
        
        console.log('callbackMethod');
        
        $cb();
    })
    ('exampleMethod', 42)() // Uses callbackMethod
    ('exampleMethod', 42)() // Reuses callbackMethod
    ;
    
// Outputs: 'exampleMethod'
//           42
//          'callbackMethod'
//          'exampleMethod'
//           42
//          'callbackMethod'
```
### Message Translation
```javascript
this.addBehaviour('MyBehaviour', {

    fullName: 'http://schema.org/name', 
    
    hello: function(person, $cb) {
    
        console.log('Hello ' + person.fullName);
    
        $cb();
    
    }

});

var me = {
        '@context': 'http://schema.org/',
        '@type': 'Person',
        'name': 'Jane Doe',
        'jobTitle': 'Professor',
        'telephone': '(425) 123-4567',
        'url': 'http://www.janedoe.com'
    }
    ;

agent('MyBehaviour')('hello', me)();

// Outputs: Hello Jane Doe
```
### Selectors
```javascript
agent('MyAgent', { 

    setup: function(cb) {
        this.$super(cb);
        
        var myBehaviourA = this.addBehaviour(
            'MyBehaviourA implements MyBehaviour', {
                exampleMethod: function($cb) {
                    console.log('MyBehaviourA.exampleMethod');
                    $cb();
                }
            }
        );
        
        this.addBehaviour(
            'MyBehaviourB implements MyBehaviour', {
                exampleMethod: function($cb) {
                    console.log('MyBehaviourB.exampleMethod');
                    $cb();
                }
            }
        );

        agent(myBehaviourA) // Select Object Directly
            ('exampleMethod')()
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'

        agent('MyBehaviourA') // Select By Interface
            ('exampleMethod')()
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'
        
        agent('MyBehaviourB') // Select By Interface
            ('exampleMethod')()
            ;
        // Outputs: 'MyBehaviourB.exampleMethod'

        agent('MyBehaviour') // Select By Interface
            ('exampleMethod')()
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'
        //          'MyBehaviourB.exampleMethod'
        
        agent('@select MyBehaviourA or MyBehaviourB') 
            // Conditionally Select By Interface
            ('exampleMethod')()
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'
        //          'MyBehaviourB.exampleMethod'
        
        agent('@select MyBehaviour not MyBehaviourB')
            // Conditionally Select By Interface
            ('exampleMethod')()
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'

        agent('@select MyBehaviour and MyBehaviourB')
            // Conditionally Select By Interface
            ('exampleMethod')()
            ;
        // Outputs: 'MyBehaviourB.exampleMethod'

    }
});
```

### Filters
```javascript
agent('MyAgent', {

    setup: function(cb) {
        this.$super(cb);
     
        // MyBehaviourA has a current HRRN Response Ratio of 3
        this.addBehaviour('MyBehaviourA implements MyBehaviour', {
            exampleMethod: function($cb) {
                console.log('MyBehaviourA.exampleMethod');
                $cb();
            }
        });
        
        // Current Ratio of 2
        this.addBehaviour('MyBehaviourB implements MyBehaviour', {
            exampleMethod: function($cb) {
                console.log('MyBehaviourB.exampleMethod');
                $cb();
            }
        });
        
        // Current Ratio of 1
        this.addBehaviour('MyBehaviourC implements MyBehaviour', {
            exampleMethod: function($cb) {
                console.log('MyBehaviourC.exampleMethod');
                $cb();
            }
        });
        
        agent('MyBehaviour')
            ('exampleMethod')() // Defaults to All Filter
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'
        //          'MyBehaviourB.exampleMethod'
        //          'MyBehaviourC.exampleMethod'
        
        agent('MyBehaviour')
            .all('exampleMethod')() // All in order of Response Ratio
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'
        //          'MyBehaviourB.exampleMethod'
        //          'MyBehaviourC.exampleMethod'
       
        agent('MyBehaviour')
            .first('exampleMethod')() // First by Response Ratio
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'

        agent('MyBehaviour')
            .last('exampleMethod')() // Last by Response Ratio
            ;
        // Outputs: 'MyBehaviourC.exampleMethod'
        
        agent('MyBehaviour')
            .closest('exampleMethod')() // Closest by Xor Distance
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'
        
         agent('MyBehaviour')
            .furthest('exampleMethod')() // Furthest by Xor Distance
            ;
        // Outputs: 'MyBehaviourC.exampleMethod'
        
        agent('MyBehaviour')
            .newest('exampleMethod')() // Newest by CreationDate
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'
        
         agent('MyBehaviour')
            .oldest('exampleMethod')() // Oldest by CreationDate
            ;
        // Outputs: 'MyBehaviourC.exampleMethod'


    }
});
```

### Interfaces
```javascript
('MyObject implements MyInterfaceA MyInterfaceB', {  
    // Agent or Behaviour
    // Accepts Messages to Interfaces MyInterfaceA and 
    // MyInterfaceB 
    
    exampleMethod: function($cb) {
        console.log('exampleMethod');
        console.log( this.getInterfaces() );
        $cb();
    }
})

agent('MyInterfaceA')
    ('exampleMethod')()
    ;
// Outputs: 'exampleMethod'
//          [   'MyObject',
//              'MyInterfaceA',
//              'MyInterfaceB'  ]
```

```javascript
('MyObject implements MyInterfaceA MyInterfaceB', { 
    // Agent or Behaviour
    // Accepts Messages to Interfaces MyInterfaceA and 
    // MyInterfaceB
    
    'MyInterfaceA.exampleMethod': function($cb) {
        console.log('MyInterfaceA.exampleMethod');
        $cb();
    },
    'MyInterfaceB.exampleMethod': function($cb) {
        console.log('MyInterfaceB.exampleMethod');
        $cb();
    }
})

agent('MyInterfaceB')
    ('exampleMethod')()
    ;
// Outputs: 'MyInterfaceB.exampleMethod'
```
```javascript
var myInterfaceB = 'MyInterfaceB'
    ; 

('MyObject implements MyInterfaceA $(MyInterfaceB)', 
    myInterfaceB, { 
    // Agent or Behaviour
    // Accepts Messages to Interfaces MyInterfaceA and 
    // MyInterfaceB

    'MyInterfaceA.exampleMethod': function($cb) {
        console.log('MyInterfaceA.exampleMethod');
        $cb();
    },
    '$(MyInterfaceB).exampleMethod': function($cb) {
        console.log('MyInterfaceB.exampleMethod');
        $cb();
    }
})

agent(myInterfaceB)
    ('exampleMethod')()
    ;
// Outputs: 'MyInterfaceB.exampleMethod'
```

```javascript
('MyObject implements /MyInt/g', { // Regular Expressions
    // Agent or Behaviour
    // Accepts Messages to any Interface matching the
    // Regular Expression Pattern /MyInt/g
    
    exampleMethod: function($cb) {
        console.log('exampleMethod');
        $cb();
    }
})

agent('MyInterface')
    ('exampleMethod')()
    ;
// Outputs: 'exampleMethod'
```

### Passivity
```javascript
agent('@passive', 'MyAgent', { 
    // Persistent Agent (destructor is never called)

});

```
```javascript
this.addBehaviour('@passive', 'MyBehaviour', {
    // Reactive Behaviour (action is never called)

});
```

### Singletons
```javascript
('@singleton', 'MyObject', { 
    // Only one instance of this Agent or 
    // Behaviour will exist

})
```
```javascript
agent(
    '@passive',
    '@singleton',
    'abstract MyAgent', {
    
        exampleMethod: function($cb) {
            console.log('exampleMethod');
            $cb();
        }
    }
);

agent('extends MyAgent'); // Exists
agent('extends MyAgent'); // Doesn't exist

agent('MyAgent')
    ('exampleMethod')()
    ;
// Output: 'exampleMethod'
```

### Simple Behaviour
```javascript
this.addBehaviour('MyBehaviour', {

    action: function($cb) {
        // Called repetitively until
        // the done Method returns true
        this.super($cb);
    },
    done: function() {
        return true; // Return true when finished
        // The Behaviour is automatically 
        // dereferenced when done
    }
});
```

### Waker Behaviour
```javascript
this.addBehaviour(
    '@period 1000', // minimum 1 second intervals
    'extends Waker', { // Waker Behaviour
    
        wake: function($cb) { // Called once each interval
            console.log('wake');
            // Call this.reset() and wake again in the
            // next interval otherwise the Behaviour is 
            // dereferenced
            
            this.$super($cb);
        }
    }
);
// Outputs: 'wake'
```

### Series Behaviour
```javascript
this.addBehaviour(
    '@flow method1 method2',
    '@flow method3 method4',
    'MyBehaviour extends Series', { // Series Behaviour
        // Calls method1 method2 method3 method4
        // in order and repetitively until done
        
        method1: function($cb) {
            console.log('method1');
            $cb('end', 'method1')(); 
            // $cb('end', 'method1')() when finished
            // otherwise $cb() to call again
        },
        method2: function($cb) {
            console.log('method2');
            $cb('end', 'method2')(); 
        },
        method3: function($cb) {
            console.log('method3');
            $cb('end', 'method3')(); 
        },
        method4: function($cb) {
            console.log('method4');
            $cb('end', 'method4')(); 
        }
    }
);
// Outputs: 'method1'
//          'method2'
//          'method3'
//          'method4'
```

### Parallel Behaviour
```javascript
this.addBehaviour(
    '@flow method1 method2 method3 method4',
    'MyBehaviour extends Parallel', { // Parallel Behaviour
        // Calls method1 method2 method3 method4
        // simultaneously and repetitively until done
        
        method1: function($cb) {
            console.log('method1');
            $cb('end', 'method1')(); 
            // $cb('end', 'method1')() when finished
            // otherwise $cb() to call again
        },
        method2: function($cb) {
            console.log('method2');
            $cb('end', 'method2')(); 
        },
        method3: function($cb) {
            console.log('method3');
            $cb('end', 'method3')(); 
        },
        method4: function($cb) {
            console.log('method4');
            $cb('end', 'method4')(); 
        }
    }
);
// Outputs: 'method1'
//          'method2'
//          'method3'
//          'method4'
```


### Queue Behaviour
```javascript
this.addBehaviour(
    '@flow nextItem',
    'MyQueue extends Queue', { // Queue Behaviour
    
        nextItem: function(item, $cb) {
            console.log(item);
            $cb();
        }
    }
);

agent('MyQueue')
    ('pause')() // Pauses the Queue
    ('push', 42)()
    ('resume')() // Un-pauses the Queue
    ('push', 43)()
    ('push', 44)()
    ;
// Outputs: 42
//          43
//          44

agent('MyQueue')
    ('push', [42, 43, 44])()
    ;
// Outputs: 42
//          43
//          44
    
```

### MapReduce Behaviour
```javascript
this.addBehaviour(
    '@flow map', // Declare 1 or more Mapper Methods
    'MyMapReduce extends MapReduce', { // MapReduce Behaviour

    map: function(value, $cb) { // Mapper Method
    
        this.write(value % 2, value); // write(key, value)
    
        $cb();
    
    },
    
    reduce: function(values, cb) { // Reducer Method
    
        console.log(values);
    
        this.$super(values, cb);
    
    }

});

agent('MyMapReduce')
    ('push', [0,1,2,3])()
    ;
    
// Outputs: [0,2]
//          [1,3]
```
```javascript
this.addBehaviour(
    '@flow doSet',
    'MyQueue extends Queue',  {
    
    doSet: function(value, $cb) {
    
        console.log(value);
    
        $cb();
        
    }

});

this.addBehaviour(
    '@flow map', // Declare 1 or more Mapper Methods
    '@push MyQueue', // Push result to MyQueue
    'MyMapReduce extends MapReduce', { // MapReduce Behaviour

    map: function(value, $cb) { // Mapper Method
    
        this.write(value % 2, value); // write(key, value)
    
        $cb();
    
    },
    
    reduce: function(values, cb) { // Reducer Method

        this.$super([values], cb); // Push entire set as value
    
    }

});

agent('MyMapReduce')
    ('push', [0,1,2,3])()
    ;
    
// Outputs: [0,2]
//          [1,3]
```
### Micro-Container Framing
```javascript

$thing.frame(function(container) { // Container Frame

    container(function(agent) { // Container A
    
        agent('example')('exampleMethod')(); // etc
    
    });
    
    container(function(agent) { // Container B
    
        agent('example')('exampleMethod')(); // etc
    
    });

});

```
### Micro-Container Auditing
```javascript

container(function(agent) {
    
    console.log(
        this.audit() // Get Audit Values
    );
        
    // Outputs: 
        
    {
        
        'source:1:8': { // Select or Delegate Source
            'created': 123456789, // First created
            'active': 123456789, // Last active
            'balance': 0, // Callback nesting
            'ticks': 100 // Approximate ticks consumed 
        },
            
        'source:7:12': {
            'created': 234567890,
            'active': 234567890,
            'balance': 1,
            'ticks': 200
        }

    }
        
    
});

```
### Agent Descriptions
```javascript

    agent(
        'http://test.com/', 
        '@author The Author', 
        '@description The Desc', 
        '@tag tag1 tag2',
        {
    
            'property a': {
                value: 'a'
            },

            setup: function(cb) {
                this.$super(cb);
            
            
                this.addBehaviour(
                    'http://www.test.com/act/ extends Queue', 
                    'implements Action', 
                    '@tag actionTag'
                );
                
            }    
    
    
        }
    );
    
    agent('@select Description http://test.com/')
        ('^data', function(data, $cb) {
        
            console.log(data);
            
            // output:
            // {
            //      '@id': 'http://test.com/agent',
            //      '@type': 'wot:thing',
            //
            //      'wot:author': ['The Author'],
            //      'wot:description': ['The Desc'],
            //      'wot:tag': ['tag1', 'tag2'],
            //      
            //      '@graph': [
            //          { 
            //              '@id': 'http://test.com/a', 
            //              '@type': 'wot:property', 
            //              'wot:writable': false 
            //                
            //          },
            //          { 
            //              '@id': 'http://test.com/act/behaviour', 
            //              '@type': 'wot:action', 
            //              'wot:tag': ['actionTag'] 
            //          }
            //      ]
            // }
        
            $cb();
            
        })
        ('get')()


```
---
## MQTT Usage
### Sensor
```javascript
agent( 
    '@host my.broker.com', // Hostname of MQTT Broker
    '@port 1883', // Optional. Defaults to 1883 or 80
    'extends Mqtt', { 
        // Uses MQTT in node.js
        // Uses MQTT over Websockets in the Browser
        
        setup: function(cb) {
            this.$super(cb);
        
            this.addBehaviour(
                'MyTopic extends Sensor', 
                    // Receive messages from the MQTT topic MyTopic
                '@flow onMessage', {
                    onMessage: function(message, $cb) {
                        console.log(message.toString());
                        $cb();
                    }
            });
        
        }
    
    }
);
```
### Actuator
```javascript
agent(
    '@host my.broker.com',
    'extends Mqtt', {
        
        setup: function(cb) {
            this.$super(cb);
        
            this.addBehaviour('MyTopic extends Actuator');
                // Send messages to the MQTT topic MyTopic
        
        }
    
    }
);

agent('MyTopic') 
    ('push', 'MyMessage')() // Send 'MyMessage' to the Actuator
    ;
    
agent('@select Actuator MyTopic') 
        // Select the specific Actuator if you have multiple objects 
        // implementing the MyTopic interface
    ('push', 'MyMessage')()
    ;
    
```
### Bridge
```javascript
agent(
    '@host my.broker.com',
    'extends Mqtt', {
    
        setup: function(cb) {
            this.$super(cb)
        
            this.addBehaviour('MyTopic extends Bridge');
                // Sends messages pushed to the Interface MyTopic    
                // to the MQTT topic MyTopic
                
                // Pushes messages received from the MQTT topic
                // MyTopic to the Interface MyTopic. 
        }
            
    }
);

agent({

    setup: function(cb) {
        this.$super(cb);
        
        this.addBehaviour(
            'extends Queue implements MyTopic', 
                // Receive messages from the MyTopic Bridge
            '@flow onMessage', {
                onMessage: function(message, $cb) {
                    console.log(message.toString());
                    $cb();
                }
        });
    }

});

agent('MyTopic') // Queue and Bridge
    ('push', 'MyMessage')() 
    ;
    
agent('@select Actuator MyTopic') // Bridge only
    ('push', 'MyMessage')() 
    ;

agent('@select Bridge MyTopic') // Bridge only
    ('push', 'MyMessage')()
    ;
```
---
## FAQ
#### Why is my Agent taken down shortly after setup?
Agents should be declared @passive or have one or more behaviours. The framework is designed to automatically dereference objects not doing anything.

---
## Contact
### Creator
- [Simon Cullen](http://github.com/cullens)

## License - "MIT"
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