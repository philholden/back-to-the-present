import {
  WRITER_SUBSCRIBE,
  WRITER_UNSUBSCRIBE,
  INTENT,
  FLUSH_CONSENSUS_ACTIONS,
  UPDATE_HEAD_TO,
} from '../constants/RealTimeMeshConstants';


export function writerSubscribe(userId) {
  return {
    type: WRITER_SUBSCRIBE,
    userId
  }
}

export function writerUnsubscribe(userId){
  return {
    type: WRITER_UNSUBSCRIBE,
    userId
  };
}

export function intent(frame, intent){
  return {
    type: INTENT,
    frame,
    intent
  };
}

export function flushConsensusActions(){
  return{
    type: FLUSH_CONSENSUS_ACTIONS
  };
}

export function (frame){
  return {
    type: UPDATE_HEAD_TO,
    frame
  };
}

