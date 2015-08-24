//var chai = require('chai');
//var expect = chai.expect;

import expect from 'expect';
var assign = require('core-js/library/fn/object/assign');
import RealTimeMeshReducer from '../src/reducers/RealTimeMeshReducer';
import {History, Frame, Subscriber} from '../src/reducers/RealTimeMeshReducer';
import {
  USER_SUBSCRIBE,
  USER_UNSUBSCRIBE,
  ADD_FRAME_INTENT,
  SET_FRAME_STATE,
  FAST_FORWARD,
  SET_HEAD,
  COMPACT_HISTORY
} from '../src/constants/RealTimeMeshConstants';
import { Record, List, Map} from 'immutable';


function reduceFrameState(intents, state) {
  state = assign({}, state);
  intents.forEach(function(intent){
    if (intent.step !== undefined) {
      state.step = intent.step;
    }
  });
  state.x += state.step;
  return state;
}

describe('reducer', () => {
  let gameReducer, startState, endState, action, testee;

  beforeEach(() => {
    gameReducer = new RealTimeMeshReducer(reduceFrameState);
  });

  describe('set state', () => {
    describe('when no frame exists', () => {
      beforeEach(() => {
        startState = undefined;
        action = {
          type: SET_FRAME_STATE,
          frameIndex: 0,
          frameState: {
            x: 0,
            horz: 0
          }
        };
        endState = gameReducer(startState, action).toJS();
        testee = endState.frames[0];
      });

      it('should create a frame at frameIndex', () => {
        expect(testee).toExist();
      });

      it('should set state of frame', () => {
        expect(testee.state).toEqual({
          horz: 0,
          x: 0
        });
      });

      it('should initialise empty intents', () => {
        expect(testee.intents).toEqual([]);
      });
    });

    describe('when frame exists', () => {

      beforeEach(() => {
        startState = new History({
          frames: List([Frame({
            intents: List([1, 2, 3])
          })])
        });
        action = {
          type: SET_FRAME_STATE,
          frameIndex: 0,
          frameState: {
            x: 0,
            horz: 0
          }
        };
        endState = gameReducer(startState, action).toJS();
        testee = endState.frames[0];
      });

      it('should set state of frame', () => {
        expect(testee.state).toEqual({
          horz: 0,
          x: 0
        });
      });

      it('should not overwrite intents', () => {
        expect(testee.intents).toEqual([1, 2, 3]);
      });
    });
  });


  describe('set intent', () => {
    describe('when no frame exists', () => {
      beforeEach(() => {
        startState = new History({
          subscribers: Map()
            .set(20, new Subscriber({userId: 20, head: 0}))
        });
        action = {
          type: ADD_FRAME_INTENT,
          frameIndex: 1,
          userId: 20,
          frameIntent: {
            step: 1
          }
        };
        endState = gameReducer(startState, action).toJS();
        testee = endState.frames[1];
      });

      it('should create a frame at frameIndex', () => {
        expect(testee).toExist();
      });

      it('should add intent to frame', () => {
        expect(testee.intents).toEqual([{step: 1}]);
      });

      it('should initialise frame state to null', () => {
        expect(testee.state).toBe(null);
      });
    });

    describe('when frame exists', () => {

      beforeEach(() => {
        startState = new History({
          subscribers: Map()
            .set(20, new Subscriber({userId: 20, head: 0})),
          frames: List([Frame({
            intents: List([{step: 1}, {step: -1}, {step: 2}]),
            state: {
              step: 0,
              x: 0
            }
          })])
        });
        action = {
          type: ADD_FRAME_INTENT,
          frameIndex: 0,
          userId: 20,
          frameIntent: {
            step: 1
          }
        };
        endState = gameReducer(startState, action).toJS();
        testee = endState.frames[0];
      });

      it('should not trash state', () => {
        expect(testee.state).toEqual({
          step: 0,
          x: 0
        });
      });

      it('should append intent', () => {
        expect(testee.intents).toEqual([
          {step: 1},
          {step: -1},
          {step: 2},
          {step: 1}
        ]);
      });

    });

    describe('consensus update', () => {

      beforeEach(() => {
        startState = new History({
          subscribers: Map()
            .set(20, new Subscriber({userId: 20, head: 10}))
            .set(21, new Subscriber({userId: 21, head: 23})),
          frames: List([Frame({
            intents: List([{step: 1}, {step: -1}, {step: 2}]),
            state: {
              step: 0,
              x: 0
            }
          })])
        });
        action = {
          type: ADD_FRAME_INTENT,
          frameIndex: 22,
          userId: 20,
          frameIntent: {
            step: 1
          }
        };
        endState = gameReducer(startState, action).toJS();
        testee = endState.consensusHead;
      });

      it('should update the consensus head', () => {
        expect(testee).toBe(22);
      });
    });
  });

  describe('subscribe', () => {

    beforeEach(() => {
      startState = new History({head: 25});
      action = {
        type: USER_SUBSCRIBE,
        userId: 20
      };
      endState = gameReducer(startState, action).toJS();
      testee = endState.subscribers[20];
    });

    it('should add subscriber to list of subscribers', () => {
      expect(testee).toExist();
    });

    // it('should flag subscriber as subscribing', () => {
    //   expect(testee.isSubscribing).toBe(true);
    // });

    it('should set subscriber head to local head', () => {
      expect(testee.head).toBe(25);
    });
  });

  describe('unsubscribe', () => {

    beforeEach(() => {
      startState = new History({
        subscribers: Map().set(50, new Subscriber({
          userId: 50,
          head: 0
        }))
      });
      action = {
        type: USER_UNSUBSCRIBE,
        userId: 50
      };
      endState = gameReducer(startState, action).toJS();
      testee = endState.subscribers;
    });

    it('should unregister subscriber', () => {
      expect(testee).toEqual({});
    });
  });

  describe('set head', () => {

    beforeEach(() => {
      startState = new History();
      action = {
        type: SET_HEAD,
        frameIndex: 50
      };
      endState = gameReducer(startState, action).toJS();
      testee = endState.head;
    });

    it('should set head', () => {
      expect(testee).toEqual(50);
    });
  });

  describe('fast-forward', () => {

    beforeEach(() => {
      startState = new History({
        head: 4,
        dirtyHead: 1,
        frames: List([
          new Frame({
            state: {
              step: 0,
              x: 0
            }
          }),
          new Frame({
            intents: List([{
              step: 2
            }])
          }),
          new Frame({
            state: {
              step: 0,
              x: 10
            }
          }),
          new Frame({
            intents: List([{
              step: 1
            }])
          }),
        ])
      });
      action = {
        type: FAST_FORWARD
      };
      endState = gameReducer(startState, action).toJS();
      testee = endState.frames;
    });

    it('should create intermediate frames', () => {
      expect(testee.length).toEqual(5);
    });

    it('should calculate each frames state correctly', ()=> {
      expect(testee.map(frame => frame.state)).toEqual([
        {x: 0, step: 0},
        {x: 2, step: 2},
        {x: 4, step: 2},
        {x: 5, step: 1},
        {x: 6, step: 1}
      ]);
    });

    it('should preserve existing intents and add empty intents as needed', () => {
      expect(testee.map(frame => frame.intents)).toEqual([
        [], [{step: 2}], [], [{step: 1}], []
      ]);
    });

    it('should move dirtyHead to head', () => {
      expect(endState.dirtyHead).toEqual(4);
    });
  });

  describe('compact-history', () => {
    beforeEach(() => {
      startState = new History({
        head: 10,
        dirtyHead: 1,
        consensusHead: 9,
        subscribers: Map()
          .set(20, new Subscriber({userId: 20, head: 10})),
        frames: List([
          new Frame({
            state: {
              step: 0,
              x: 0
            }
          }),
          new Frame({
            intents: List([{
              step: 2
            }])
          }),
          new Frame({
            state: {
              step: 0,
              x: 10
            }
          }),
          new Frame({
            intents: List([{
              step: 1
            }])
          })
        ])
      });

      action = {
        type: FAST_FORWARD
      };
      endState = gameReducer(startState, action);
      action = {
        type: COMPACT_HISTORY
      };
      endState = gameReducer(endState, action).toJS();
      testee = endState.frames;
    });

    it('should remove all state after the compactHead and before the consensusHead', () => {
      var states = testee.map((frame) => frame.state);
      expect(states[0]).toExist();
      expect(states[1]).toBe(null);
      expect(states[2]).toBe(null);
      expect(states[3]).toBe(null);
      expect(states[4]).toBe(null);
      expect(states[5]).toBe(null);
      expect(states[6]).toBe(null);
      expect(states[7]).toBe(null);
      expect(states[8]).toBe(null);
      expect(states[9]).toExist();
      expect(states[10]).toExist();
    });

    it('should update compactHead', () => {
      expect(endState.compactHead).toBe(8);
    });

  });

});
