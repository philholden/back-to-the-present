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

export const History = Record({
  userId: 0,
  head: 0,
  isSubscribing: false,
  dirtyHead: 1,
  compactHead: 0,
  consensusHead: 0,
  subscribers: Map(), //{id, head, consensusOn}
  frames: List() //{intents, state}
});

export const Frame = Record({
  intents: List(),
  state: null
});

export const Subscriber = Record({
  userId: 0,
  head: 0,
  //isSubscribing: false
});

function setHead(frameIndex, stateHistory) {
  return stateHistory.set('head', frameIndex);
}

function setDirtyHead(frameIndex, stateHistory) {
  return stateHistory.set('dirtyHead', frameIndex);
}

function setCompactHead(frameIndex, stateHistory) {
  return stateHistory.set('compactHead', frameIndex);
}

function addFrameIntent(frameIndex, intent, stateHistory) {
  var frame = stateHistory.frames.get(frameIndex) || new Frame();
  let intents = frame.intents.push(intent);
  frame = frame.set('intents', intents);
  return stateHistory.setIn(['frames', frameIndex], frame);
}

function setFrameState(frameIndex, state, stateHistory) {
  var frame = stateHistory.frames.get(frameIndex) || new Frame();
  frame = frame.set('state', state);
  return stateHistory.setIn(['frames', frameIndex], frame);
}

function setSubscriberHead(userId, frameIndex, stateHistory) {
  //var oldHead = stateHistory.subscribers.get(userId) || 0;
  //var newHead = oldHead < frameIndex ? frameIndex : oldHead;
  if (stateHistory.subscribers.get(userId) === undefined) {
    console.warn('setSubscriber head user not found', userId);
  }
  return stateHistory.setIn(['subscribers', userId, 'head'], frameIndex);
}

function compactHistory(stateHistory) {
  const {compactHead, consensusHead} = stateHistory;
  for (let frameIndex = compactHead + 1; frameIndex < consensusHead; frameIndex++) {
    stateHistory = stateHistory.setIn(['frames', frameIndex, 'state'], null);
  }
  return setCompactHead(stateHistory.consensusHead - 1, stateHistory);
}

function updateConsensusHead(stateHistory) {
  var minHead = stateHistory.subscribers.map(subscriber => subscriber.head).min() || stateHistory.consensusHead;
  stateHistory = stateHistory.set('consensusHead', minHead);
  return stateHistory;
}

function updateDirtyHead(frameIndex, stateHistory) {
  if (frameIndex >= stateHistory.dirtyHead) return stateHistory;
  return setDirtyHead(frameIndex, stateHistory);
}

function setUserIntent(userId, frameIndex, intent, stateHistory) {
  stateHistory = addFrameIntent(frameIndex, intent, stateHistory);
  stateHistory = setSubscriberHead(userId, frameIndex, stateHistory);
  stateHistory = updateConsensusHead(stateHistory);
  stateHistory = updateDirtyHead(frameIndex, stateHistory);
  return stateHistory;
}

function updateFrameState(frameIndex, reduce, stateHistory) {
  var frame = stateHistory.frames.get(frameIndex) || new Frame();
  var {intents} = frame;
  var prevFrame = stateHistory.frames.get(frameIndex - 1);
  var state = prevFrame && prevFrame.state;
  if (state === undefined) {
    console.warn('tried to reduce undefined state at frameIndex:', frameIndex);
    return stateHistory;
  }
  state = reduce(intents, state);
  frame = frame.set('state', state);
  return stateHistory.setIn(['frames', frameIndex], frame);
}

function fastforward(reduce, stateHistory) {
  var frameIndex;
  const {head, dirtyHead} = stateHistory;
  for (frameIndex = dirtyHead; frameIndex <= head; frameIndex++) {
    stateHistory = updateFrameState(frameIndex, reduce, stateHistory);
  }
  stateHistory = setDirtyHead(head, stateHistory);
  return stateHistory;
}

function subscribe(userId, stateHistory) {
  //push relay
  var {subscribers} = stateHistory;
  var subscriber = new Subscriber({
    userId: userId,
    head: stateHistory.head,
    //isSubscribing: true
  });
  stateHistory = stateHistory.setIn(['subscribers', userId], subscriber);
  return stateHistory;
}

function unsubscribe(userId, stateHistory) {
  stateHistory = stateHistory.deleteIn(['subscribers'], userId);
  stateHistory = updateConsensusHead(stateHistory);
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
      const {frameState} = action;
      return setFrameState(action.frameIndex, frameState, stateHistory);
    case ADD_FRAME_INTENT:
      const {userId, frameIntent} = action;
      return setUserIntent(userId, action.frameIndex, frameIntent, stateHistory);
    case SET_HEAD:
      return setHead(action.frameIndex, stateHistory);
    case COMPACT_HISTORY:
      return compactHistory(stateHistory);
    default:
      return stateHistory;
    }
  };
}
