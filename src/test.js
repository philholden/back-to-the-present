import RealTimeMeshReducer from './reducers/RealTimeMeshReducer';
var assign = require('core-js/library/fn/object/assign');


function reduceFrameState(intents, state) {
  state = assign({}, state);
  intents.forEach(function(intent){
    if (intent.horz !== undefined) {
      state.horz = intent.horz;
    }
  });
  state.x += state.horz;
  return state;
}

var gameReducer = new RealTimeMeshReducer(reduceFrameState);
var state;
state = gameReducer(undefined, {
  type: 'SET_FRAME_STATE',
  frameIndex: 0,
  frameState: {
    x: 0,
    horz: 0
  }
});

console.log('init: ', state.frames.toJS());

state = gameReducer(state, {
  type: 'USER_SUBSCRIBE',
  userId: 10
});

console.log('subscribe: ', state.frames.toJS());

state = gameReducer(state, {
  type: 'ADD_FRAME_INTENT',
  frameIndex: 1,
  frameIntent: {
    horz: 1
  },
  userId: 10
});

console.log('set horz: ', state.frames.toJS());

state = gameReducer(state, {
  type: 'SET_HEAD',
  frameIndex: 3
});

console.log('update-head: ', state.frames.toJS());

state = gameReducer(state, {
  type: 'FAST_FORWARD',
  frameIndex: 3
});

console.log('fast-forward: ', state.toJS());
