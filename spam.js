// Per-author burst detection: `threshold` messages inside `time` seconds is spam.
// A message containing one of `words` is spam on its own.
function createSpamTracker({ threshold, time, words = [] }) {
	const windowMs = time * 1000;
	const needles = words.map(w => w.toLowerCase());
	const history = new Map();

	function check({ authorId, messageId, content, timestamp }) {
		const text = (content || '').toLowerCase();
		const word = needles.find(w => text.includes(w));
		if (word) {
			return { spam: true, reason: `contains "${word}"`, messageIds: [messageId] };
		}

		const recent = (history.get(authorId) || []).filter(m => timestamp - m.timestamp < windowMs);
		recent.push({ messageId, timestamp });
		if (recent.length >= threshold) {
			// start a fresh window so one burst is reported once, not once per extra message
			history.delete(authorId);
			return {
				spam: true,
				reason: `${recent.length} messages in ${time}s`,
				messageIds: recent.map(m => m.messageId),
			};
		}
		history.set(authorId, recent);
		return { spam: false };
	}

	// drop authors who have gone quiet so the map doesn't grow forever
	function prune(now) {
		for (const [authorId, recent] of history) {
			if (recent.every(m => now - m.timestamp >= windowMs)) {
				history.delete(authorId);
			}
		}
	}

	return { check, prune };
}

module.exports = { createSpamTracker };
