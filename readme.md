# Back To The Present

This reducer facilitates the sharing of state between clients that are part of a peer to peer mesh. It particularly has games communicating over WebRTC in mind. When a user moves their controller they should see their character respond with zero latency. However when the move of a remote player arrives over then network (slightly delayed) the game rewinds its state to the point in time at which that players move took place. It interprets that move in the past and then fast-forwards all the known intermediate moves to bring the game back to the present for the local player to see.      

## Subscription

A new user is able to join in the middle of a game.

1. The subscribing client sends a subscribe request to each client
2. Each client sends back its current head and any future actions to the subscriber
3. The subscribing client waits until its `consensusHead` is beyond the point all the remote `head`s were at when it subscribed
4. The subscribing client can then requests the state at the `consensusHead` from a random client
5. The subscribing client replays any remote actions falling later than the `consensusHead` on the state at the received state
6. The subscribing client is now live and can send actions to other clients

