'use strict';

var agent = require('../bootstrap/node.js');

process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

$thing.merge(exports, require(__dirname + '/suite/test-agent.js'));
$thing.merge(exports, require(__dirname + '/suite/test-behaviour.js'));
$thing.merge(exports, require(__dirname + '/suite/test-objects.js'));
$thing.merge(exports, require(__dirname + '/suite/test-meta.js'));
$thing.merge(exports, require(__dirname + '/suite/test-messaging.js'));
$thing.merge(exports, require(__dirname + '/suite/test-series.js'));
$thing.merge(exports, require(__dirname + '/suite/test-parallel.js'));
$thing.merge(exports, require(__dirname + '/suite/test-queue.js'));
$thing.merge(exports, require(__dirname + '/suite/test-waker.js'));
$thing.merge(exports, require(__dirname + '/suite/test-mqtt.js'));
$thing.merge(exports, require(__dirname + '/suite/test-container.js'));
$thing.merge(exports, require(__dirname + '/suite/test-mapreduce.js'));
$thing.merge(exports, require(__dirname + '/suite/test-property.js'));
$thing.merge(exports, require(__dirname + '/suite/test-bugs.js'));