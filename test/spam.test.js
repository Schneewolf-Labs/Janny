const test = require('node:test');
const assert = require('node:assert');
const { createSpamTracker } = require('../spam');

const msg = (authorId, messageId, timestamp, content = 'hi') => ({ authorId, messageId, timestamp, content });

test('flags a burst at the threshold', () => {
	const t = createSpamTracker({ threshold: 3, time: 10 });
	assert.equal(t.check(msg('a', '1', 0)).spam, false);
	assert.equal(t.check(msg('a', '2', 1000)).spam, false);
	const res = t.check(msg('a', '3', 2000));
	assert.equal(res.spam, true);
	assert.deepEqual(res.messageIds, ['1', '2', '3']);
});

test('messages outside the window do not count', () => {
	const t = createSpamTracker({ threshold: 3, time: 10 });
	t.check(msg('a', '1', 0));
	t.check(msg('a', '2', 1000));
	assert.equal(t.check(msg('a', '3', 11000)).spam, false);
});

test('authors are tracked separately', () => {
	const t = createSpamTracker({ threshold: 2, time: 10 });
	assert.equal(t.check(msg('a', '1', 0)).spam, false);
	assert.equal(t.check(msg('b', '2', 0)).spam, false);
	assert.equal(t.check(msg('a', '3', 0)).spam, true);
});

test('a burst is reported once, then the window restarts', () => {
	const t = createSpamTracker({ threshold: 2, time: 10 });
	t.check(msg('a', '1', 0));
	assert.equal(t.check(msg('a', '2', 0)).spam, true);
	assert.equal(t.check(msg('a', '3', 0)).spam, false);
});

test('spam words flag a single message, case-insensitively', () => {
	const t = createSpamTracker({ threshold: 5, time: 10, words: ['free nitro'] });
	const res = t.check(msg('a', '1', 0, 'Get FREE NITRO here'));
	assert.equal(res.spam, true);
	assert.deepEqual(res.messageIds, ['1']);
});

test('prune forgets quiet authors', () => {
	const t = createSpamTracker({ threshold: 2, time: 10 });
	t.check(msg('a', '1', 0));
	t.prune(20000);
	assert.equal(t.check(msg('a', '2', 0)).spam, false);
});
