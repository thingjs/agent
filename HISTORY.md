History
=======

## 0.2.2

* Implemented HRRN action() and Message Scheduling
* Implemented JSON-LD Ontology Definitions and Message Term Translation
* Implemented MapReduce Behaviour
* Flow Behaviour changes: implicit yeilding and Flow Methods can now be removed out of line
* Newly created Microcontainers are populated with parent container abstract delegates
* Microcontainers and Sources are now identified with getThreadId()
* The V8 getThreadId() uses prepareStackTrace() for Backtracing (faster than exceptions)
* More efficient memory usage in most use cases

## 0.2.1

* Added Microcontainers
* Annotation Bugfix

## 0.2.0

* Split source file into modules
* Added MQTT Transport
* Selector Bugfix

## 0.1.1

* Fixed $thing global
* Added Heartbeat Agent
* Improvements to the Waker Behaviour

## 0.1.0

* Initial release