import {
  USER_SUBSCRIBE,
  USER_UNSUBSCRIBE,
  ADD_FRAME_INTENT,
  SET_FRAME_STATE,
  FAST_FORWARD,
} from '../constants/RealTimeMeshConstants';


export function userSubscribe(userId) {
  return {
    type: USER_SUBSCRIBE,
    userId
  };
}

export function userUnsubscribe(userId){
  return {
    type: USER_UNSUBSCRIBE,
    userId
  };
}

export function addFrameIntent(frameIndex, frameIntent){
  return {
    type: ADD_FRAME_INTENT,
    frameIndex,
    frameIntent
  };
}

export function setFrameState(frameIndex, frameState){
  return {
    type: SET_FRAME_STATE,
    frameIndex,
    frameState
  };
}

export function fastForward(){
  return {
    type: FAST_FORWARD
  };
}

