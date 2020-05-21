// data structure to maintain state
let state = {
	currentSessionName: null,
	sessions: [],
	tabs: [],
};

// on script start
// get locally stored sessions
chrome.storage.local.get(['sessions'], (result) => {
	console.info('fetching data from storage', result);
	if (result.sessions) {
		state.sessions = result.sessions;
	}
});

function appendCreatedTab(tab) {
	state.tabs.push(tab);
	console.info('new tab created', tab);
}

function removeTab(tabId) {
	state.tabs = state.tabs.filter((tab) => tab.id !== tabId);
	console.info('tab removed', tabId);
}

function updateTab(tabId, changeLog, tab) {
	state.tabs = state.tabs.map((tab_) => (tab_.id === tabId ? tab : tab_));
	console.info('tab updated', tab);
}

function startPreviosSession(session) {
	// remove all tabs within every windows 😈
	chrome.tabs.query({}, (tabs) => {
		tabs.forEach((tab) => chrome.tabs.remove(tab.id));
		console.info('removed existing tabs', tabs);
	});

	state.tabs = session.tabs;
	state.tabs.forEach((tab) => {
		chrome.tabs.create({ url: tab.url });
	});
	console.info('created session tabs', state.tabs);
}

function startNewSession(session) {
	// add every tab in current window to the
	chrome.tabs.query({}, (tabs) => {
		state.tabs = tabs;
		console.info('added current tabs to session tabs', tabs);
	});

	state.sessions.push(session);
}

function detachCurrentSession() {
	state.sessions.forEach((session) => {
		if (session.name === state.currentSessionName) {
			session.tabs = state.tabs;
		}
	});

	chrome.storage.local.set({ sessions: state.sessions });
	state.currentSessionName = null;
	state.tabs = [];

	// remove all tabs within every windows 😈
	chrome.tabs.query({}, (tabs) => {
		tabs.forEach((tab) => chrome.tabs.remove(tab.id));
		console.info('removed existing tabs', tabs);
	});

	chrome.tabs.create({});
}

chrome.runtime.onMessage.addListener((action, req, callbackFn) => {
	switch (action.actionType) {
		case 'START_SESSION':
			state.currentSessionName = action.sessionName;
			const thatSessionL = state.sessions.filter(
				(session) => session.name === state.currentSessionName
			);
			thatSessionL.length === 0
				? startNewSession({ name: state.currentSessionName })
				: startPreviosSession(thatSessionL[0]); // open tabs from that session

			chrome.tabs.onCreated.addListener(appendCreatedTab);
			chrome.tabs.onUpdated.addListener(updateTab);
			chrome.tabs.onRemoved.addListener(removeTab);

			callbackFn(state);
			console.log(state);
			break;

		case 'DETACH_SESSION':
			chrome.tabs.onCreated.removeListener(appendCreatedTab);
			chrome.tabs.onUpdated.removeListener(updateTab);
			chrome.tabs.onRemoved.removeListener(removeTab);

			detachCurrentSession();

			callbackFn(state);
			break;

		case 'FETCH_STATE':
			callbackFn(state);

		default:
			break;
	}
});
