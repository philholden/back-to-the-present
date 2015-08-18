import { Record, List, Map, toImmutable} from 'immutable';

window.List = List;

// const startTime = Date.now();
// const getTick = () => (Date.now() - startTime) / (1000 / 60);

const History = Record({
  userId: 0,
  head: 0,
  isSubscribing: false,
  dirtyHead: 0,
  consensusHead: 0,
  subscribers: Map(), //{id, head, consensusOn}
  consensusActions: List(), //[playsound]
  frames: List() //{intents, state}
});

const Frame = Record({
  intents: List(),
  state: {}
})

const Subscriber = Record({
  userId: 0,
  head: 0,
  isSubscribing: false
});

const stateHistory = new History();

window.stateHistory = stateHistory;
console.log(window.stateHistory.toJS());


function setIntent(frameIndex, intent, history) {
  var frame = history.frames.get(frameIndex);
  if (frame === undefined) {
    frame = new Frame();
  }
  frame = frame.intents.push(intent);
  return history.frames.set(frameIndex, frame);
}

function setSubscriberHead(userId, frameIndex, history) {
  var oldHead = history.subscribers.get(userId) || 0;
  var newHead = oldHead < frameIndex ? frameIndex : oldHead;
  return history.setIn(['subscribers', userId, 'head', newHead]);
}

function updateConsensusHead(history) {
  var minHead = history.subscribers.map(subscriber => subscriber.head).min();
  history = history.set('consensusHead', minHead);
  return history;
}

function setUserIntent(userId, frameIndex, intent, history) {
  history = setIntent(frameIndex, intent, history);
  history = setWriterHeads(userId, frameIndex, history);
  history = updateConsensusHead();
}

function setHead(frameIndex) {
  return history.head.set(frameIndex);
}

function nextFrameState(frameIndex, reduce, history) {
  var intents = history.frames.get(frameIndex).intents;
  var state = history.frames.get(frameIndex).state;
  return reduce(intents, state);
}

function fastforward(fromFrameIndex, toFrameIndex, reduce, history) {
  var frameIndex;
  var next;
  for (frameIndex = fromFrameIndex; frameIndex <= toFrameIndex; frameIndex++) {
    next = nextFrameState(frameIndex, reduce, history);
    history = history.setIn(['frames', frameIndex, 'state'], next);
  }
  history = setHead(toFrameIndex);
  return history;
}

function subscribe(userId, history) {
  //push relay
  var {subscribers} = history;
  var subscriber = new Subscriber({
    userId: userId,
    head: history.head,
    isSubscribing: true
  });
  subscribers = subscribers.push(subscriber);
  history = history.setIn('subscriber', subscribers);
  return history;
}

function unsubscribe(userId, history) {
  history = history.deleteIn('subscribers', userId);
  return history;
}

//window.recordIntent = recordIntent;
//window.updateWriterHeads = updateWriterHeads;


// This is just for reflux dev tools
// function toImmutable(state) {
//   if (state instanceof Record) {
//     return state;
//   } else {
//     state.rows = List(state.rows);
//     return new Table(state);
//   }
// }

export default function (index, action) {
  var state = toImmutable(state);
  switch (action.type) {

  default:
    return state;
  }
}
