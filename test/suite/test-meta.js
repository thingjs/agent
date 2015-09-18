'use strict';

var agent = $thing.agent;

exports['meta'] = function(test) {
    test.expect(5);
    agent(
        '@a',
        '@b once +', 'upon $ +', 'a', 'time',
        '@c',
        '@passive',
        'J', {
            setup: function(cb) {
                if (this.getInterfaces().indexOf('K') == -1) { // meta is _not_ inherited
                    test.ok(true, 'J.setup');
                    test.deepEqual(
                        this.getMeta(),
                        ['a', 'b once upon a time', 'c', 'passive'],
                        'this.getMeta() == ["a", "b once upon a time", "c", "passive"]'
                    );
                }
                else {
                    test.deepEqual(
                        this.getMeta(),
                        ['a', 'b once upon a time', 'c', 'passive', 'd'],
                        'this.getMeta() == ["a", "b once upon a time", "c", "passive", "d"]'
                    );
                }
                this.$super(cb);
            }
        }
    );
    agent(
        '@d',
        'K extends J', {
            setup: function(cb) {
                test.ok(true, 'K.setup');
                test.deepEqual(
                    this.getMeta(),
                    ['a', 'b once upon a time', 'c', 'passive', 'd'],
                    'this.getMeta() == ["a", "b once upon a time", "c", "passive", "d"]'
                );
                this.$super(cb);
            }
        }
    );
    test.done();
};

exports['substitute'] = function(test) {
    test.expect(5);
    var uuid1 = 'uuid1';
    agent(
        'implements $(interface1)', uuid1,
        '@$(x)', true,
        'R', {
            setup: function(cb) {
                this.$super(cb);
                test.ok(true, 'setup');
                test.equal(this.$interface1, 'uuid1', 'this.$interface1 == "uuid1"');
                test.equal(this.$x, true, 'this.$x == true');
                agent(uuid1)('method')();
            },
            takedown: function(cb) {
                test.ok(true, 'takedown');
                this.$super(cb);
                test.done();
            },
            '$(interface1).method': function($cb) {
                test.ok(true, '$(interface1).method');
                $cb();
            }
        }
    );
};