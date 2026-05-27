import { useRef, useState } from "react";

export function useRTCConnect() {
  const user1 = useRef(null);
  const user2 = useRef(null);

  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);

  async function connect(localStream) {
    user1.current = new RTCPeerConnection();
    user2.current = new RTCPeerConnection();

    localStream.getTracks().forEach((track) => {
      user1.current.addTrack(track, localStream);
    });

    user1.current.onicecandidate = (e) => {
      if (e.candidate) user2.current.addIceCandidate(e.candidate);
    };
    user2.current.onicecandidate = (e) => {
      if (e.candidate) user1.current.addIceCandidate(e.candidate);
    };

    user2.current.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      setConnected(true);
    };
    const offer = await user1.current.createOffer();
    await user1.current.setLocalDescription(offer);
    await user2.current.setRemoteDescription(offer);

    const answer = await user2.current.createAnswer();
    await user1.current.setRemoteDescription(answer);
    await user2.current.setLocalDescription(answer);
  }

  function disconnect() {
    user1.current?.close();
    user2.current?.close();
    setConnected(false);
    setRemoteStream(null);
  }

  return { connect, disconnect, connected, remoteStream };
}
