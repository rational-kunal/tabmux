function bgUpdateStateUI(msg) {
	chrome.runtime.sendMessage(msg, (state_) => {
		state = state_;
		updateUI();
	});
}

// all the data needed for ui
let state = null;

const formNode = document.getElementById('form');

const inputNode = document.getElementById('session_form_name');
// some random text for input
inputNode.setAttribute('value', Math.random().toString(36).substring(7)); // TODO: validation

const submitNode = document.getElementById('sesssion_form_btn');
submitNode.addEventListener('click', () => {
	// on click send signal to bgscript
	bgUpdateStateUI({
		actionType: 'START_SESSION',
		sessionName: inputNode.getAttribute('value'),
	});
});

const detachNode = document.getElementById('detach_session_btn');
detachNode.addEventListener('click', () => {
	bgUpdateStateUI({
		actionType: 'DETACH_SESSION',
	});
});

const sessionListNode = document.getElementById('session_list');

formNode.style.display = 'none'; // initially state is not availabel
detachNode.style.display = 'none';

// state is updated now run this thingy
function updateUI() {
	console.log(state);
	if (state.currentSessionName === null) {
		// there is no currenSession so user can opt to start the show
		formNode.style.display = 'block';
		detachNode.style.display = 'none';
	} else {
		formNode.style.display = 'none';
		detachNode.style.display = 'block';
		detachNode.setAttribute('value', state.currentSessionName + ' dettach');
	}

	sessionListNode.innerHTML = ''; // remove all children 😈

	state.sessions.forEach((session) => {
		sessionListNode.appendChild(button(session.name));
	});
}

function button(txt) {
	const btnNode = document.createElement('button');
	btnNode.innerText = txt;

	return btnNode;
}

chrome.runtime.sendMessage({ actionType: 'FETCH_STATE' }, (state_) => {
	state = state_;
	updateUI();
});
