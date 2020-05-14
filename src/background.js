let state = {
	currentSessionName: null,
	sessions: [],
};
// chrome.storage.sync.set({ xyz: 'xyz' });

// get locally stored sessions
chrome.storage.local.get(['sessions'], (result) => {
	if (result.sessions) {
		state.sessions = result.sessions;
	}
});

let tabs = [];
function appendCreatedTab(tab) {
	tabs.push(tab);
	console.log(tabs);
}

function removeTab(tabId) {
	tabs = tabs.filter((tab) => tab.id !== tabId);
	console.log(tabs);
}

function updateTab(tabId, changeLog, tab) {
	tabs = tabs.map((tab_) => (tab_.id === tabId ? tab : tab_));
	// console.log(tabs, tab.id);
}

function copenTabs(tabs) {
	// remove all tabs within every windows 😈
	chrome.tabs.query({}, (tabs) => {
		tabs.forEach((tab) => chrome.tab.remove(tab.id));
	});

	tabs.forEach((tab) => {
		chrome.tabs.create({ url: tab.url });
	});
}

chrome.runtime.onMessage.addListener((action, req, callbackFn) => {
	switch (action.actionType) {
		case 'START_SESSION':
			state.currentSessionName = action.sessionName;
			const thatSessionL = state.sessions.filter(
				(session) => session.name === state.currentSessionName
			);
			thatSessionL.length === 0
				? state.sessions.push({ name: state.currentSessionName })
				: copenTabs(thatSessionL[0].tabs); // open tabs from that session

			chrome.tabs.onCreated.addListener(appendCreatedTab);
			chrome.tabs.onUpdated.addListener(updateTab);
			chrome.tabs.onRemoved.addListener(removeTab);

			callbackFn(state);
			console.log(state);
			break;

		case 'DETACH_SESSION':
			state.sessions.forEach((session) => {
				if (session.name === state.currentSessionName) {
					session.tabs = tabs;
				}
			});
			console.log(state);
			chrome.storage.sync.set({ sessions: state.sessions });
			state.currentSessionName = null;

			chrome.tabs.onCreated.removeListener(appendCreatedTab);
			chrome.tabs.onUpdated.removeListener(updateTab);
			chrome.tabs.onRemoved.removeListener(removeTab);

			callbackFn(state);
			break;

		case 'FETCH_STATE':
			callbackFn(state);

		default:
			break;
	}
	// chrome.tabs.getAllInWindow(null, (result) => {
	// 	chrome.tabs.remove(result.map((tab) => tab.id));
	// 	chrome.tabs.create({});
	// });
});
