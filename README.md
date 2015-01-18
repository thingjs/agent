![thing.js: Internet of Wild Things](https://thingjs.github.io/cdn/images/thingjs-header-850-blue.png)

[![Build Status](https://travis-ci.org/thingjs/agent.svg?branch=master)](https://travis-ci.org/thingjs/agent)

Thing.js is an Agent Framework written in JavaScript for building Internet of Things applications. The framework supports Node.js, the Browser, Tessel, Phonegap, JavaScriptCore and other Mobile Containers.

## Features

- Abstractions, Inheritance and Interfaces
- Annotations and Templates
- Passivity and Singletons
- Simple, Series, Parallel, Queue and Waker Primitive Behaviours
- Asynchronous Messaging, Selectors and Filters

## Installation
##### In the Browser
```html
<script type="text/javascript" src="https://thingjs.github.io/cdn/lib/thingjs-agent-0.1.0-withasync.min.js"></script>
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

        this.addBehaviour(
            '@passive',
            'search', {
                forNeo: function($cb) {
                    $cb('found', this.$owner.quote)();
                }
            }
        );
    }
});

agent('extends smith');
agent('extends smith');
agent('extends smith');

agent('search')
    ('forNeo')({
        found: function(quote, $cb) {
            console.log(quote);
            $cb();
        }
    })
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

    exampleMethod($cb) { 
        // Method with Callback Object Argument $cb
        
        console.log('exampleMethod');
        
        $cb(); // Callback (once per call)
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

    exampleMethod(meaningOfLife, $cb) { 
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
        // Callback Objects may be Agent Declarations or Selectors
        
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
     
        this.addBehaviour('MyBehaviourA implements MyBehaviour', {
            exampleMethod: function($cb) {
                console.log('MyBehaviourA.exampleMethod');
                $cb();
            }
        });
        
        this.addBehaviour('MyBehaviourB implements MyBehaviour', {
            exampleMethod: function($cb) {
                console.log('MyBehaviourB.exampleMethod');
                $cb();
            }
        });
         
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
            .all('exampleMethod')() // All Filter
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'
        //          'MyBehaviourB.exampleMethod'
        //          'MyBehaviourC.exampleMethod'
       
        agent('MyBehaviour')
            .first('exampleMethod')() // First Filter
            ;
        // Outputs: 'MyBehaviourA.exampleMethod'

        agent('MyBehaviour')
            .last('exampleMethod')() // Last Filter
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
('MyObject implements /MyInt*/g', { // Regular Expressions
    // Agent or Behaviour
    // Accepts Messages to any Interface matching the
    // Regular Expression Pattern /MyInt*/g
    
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
            $cb('done')(); 
            // $cb('done') when finished
            // otherwise $cb() or $cb('yield')() to call again
        },
        method2: function($cb) {
            console.log('method2');
            $cb('done')(); 
        },
        method3: function($cb) {
            console.log('method3');
            $cb('done')(); 
        },
        method4: function($cb) {
            console.log('method4');
            $cb('done')(); 
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
            $cb('done')(); 
            // $cb('done') when finished
            // otherwise $cb() or $cb('yield')() to call again
        },
        method2: function($cb) {
            console.log('method2');
            $cb('done')(); 
        },
        method3: function($cb) {
            console.log('method3');
            $cb('done')(); 
        },
        method4: function($cb) {
            console.log('method4');
            $cb('done')(); 
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
    ('push', 42)()
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