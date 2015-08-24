import { Record, List, Map} from 'immutable';
import {
  USER_SUBSCRIBE,
  USER_UNSUBSCRIBE,
  ADD_FRAME_INTENT,
  SET_FRAME_STATE,
  FAST_FORWARD,
  SET_HEAD,
  COMPACT_HISTORY
} from '../constants/RealTimeMeshConstants';

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
  frames: List() //{intents, state}
});


const Frame = Record({
  intents: List(),
  state: {}
});

const Subscriber = Record({
  userId: 0,
  head: 0,
  isSubscribing: false
});

function addFrameIntent(frameIndex, intent, stateHistory) {
  var frame = stateHistory.frames.get(frameIndex);
  if (frame === undefined) {
    frame = new Frame();
  }
  frame = frame.intents.push(intent);
  return stateHistory.frames.set(frameIndex, frame);
}

function setFrameState(frameIndex, state, stateHistory) {
  var frame = stateHistory.frames.get(frameIndex);
  if (frame === undefined) {
    frame = new Frame();
  }
  frame = frame.setState(state);
  return stateHistory.frames.set(frameIndex, frame);
}

function setSubscriberHead(userId, frameIndex, stateHistory) {
  var oldHead = stateHistory.subscribers.get(userId) || 0;
  var newHead = oldHead < frameIndex ? frameIndex : oldHead;
  return stateHistory.setIn(['subscribers', userId, 'head', newHead]);
}

function compactHistory(stateHistory) {
  const {compactHead, consensusHead} = stateHistory;
  for (let frameIndex = compactHead; frameIndex <= consensusHead; frameIndex++) {
    stateHistory = stateHistory.setIn(['frames', frameIndex, 'state'], null);
  }
}

function updateConsensusHead(stateHistory) {
  var minHead = stateHistory.subscribers.map(subscriber => subscriber.head).min();
  stateHistory = stateHistory.set('consensusHead', minHead);
  return stateHistory;
}

function setUserIntent(userId, frameIndex, intent, stateHistory) {
  stateHistory = addFrameIntent(frameIndex, intent, stateHistory);
  stateHistory = setSubscriberHead(userId, frameIndex, stateHistory);
  stateHistory = updateConsensusHead();
}

function setHead(frameIndex, stateHistory) {
  return stateHistory.head.set(frameIndex);
}

function setDirtyHead(frameIndex, stateHistory) {
  return stateHistory.dirtyHead.set(frameIndex);
}

function nextFrameState(frameIndex, reduce, stateHistory) {
  var intents = stateHistory.frames.get(frameIndex).intents;
  var state = stateHistory.frames.get(frameIndex).state;
  return reduce(intents, state);
}

function fastforward(reduce, stateHistory) {
  var frameIndex;
  var next;
  const {head, dirtyHead} = stateHistory;
  for (frameIndex = dirtyHead; frameIndex <= head; frameIndex++) {
    next = nextFrameState(frameIndex, reduce, stateHistory);
    stateHistory = stateHistory.setIn(['frames', frameIndex, 'state'], next);
  }
  stateHistory = setDirtyHead(head);
  return stateHistory;
}

function subscribe(userId, stateHistory) {
  //push relay
  var {subscribers} = stateHistory;
  var subscriber = new Subscriber({
    userId: userId,
    head: stateHistory.head,
    isSubscribing: true
  });
  subscribers = subscribers.push(subscriber);
  stateHistory = stateHistory.setIn('subscriber', subscribers);
  return stateHistory;
}

function unsubscribe(userId, stateHistory) {
  stateHistory = stateHistory.deleteIn('subscribers', userId);
  return stateHistory;
}

export default function RealTimeMeshReducer(reduceFrameState) {
  const initialStateHistory = new History();

  return function (stateHistory = initialStateHistory, action) {
    switch (action.type) {
    case USER_SUBSCRIBE:
      return subscribe(action.userId, stateHistory);
    case USER_UNSUBSCRIBE:
      return unsubscribe(action.userId, stateHistory);
    case FAST_FORWARD:
      return fastforward(reduceFrameState, stateHistory);
    case SET_FRAME_STATE:
      const {frameIndex, frameState} = action;
      return setFrameState(frameIndex, frameState, stateHistory);
    case ADD_FRAME_INTENT:
      const {frameIndex, frameIntent} = action;
      return addFrameIntent(frameIndex, frameIntent, stateHistory);
    case SET_HEAD:
      return setHead(action.frameIndex, stateHistory);
    case COMPACT_HISTORY:
      return compactHistory(stateHistory);
    default:
      return stateHistory;
    }
  };
}
