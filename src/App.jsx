import { useRef, useState, useEffect } from "react";
import { useRTCConnect } from "./hooks/useRTCConnect";
import "./App.css";

function App() {
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const [status, setStatus] = useState("выключено");
  const [volume, setVolume] = useState(0);

  const { connect, disconnect, connected, remoteStream } = useRTCConnect();

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    setStatus("включено");

    const worker = new Worker("/audioWorker.js");
    workerRef.current = worker;
    worker.onmessage = (e) => setVolume(Math.round(e.data * 100));

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    ctx.createMediaStreamSource(stream).connect(analyser);

    intervalRef.current = setInterval(() => {
      const data = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(data);
      worker.postMessage(data);
    }, 200);
  }

  function stopMic() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    clearInterval(intervalRef.current);
    workerRef.current?.terminate();
    audioCtxRef.current?.close();
    setStatus("выключено");
    setVolume(0);
  }

  return (
    <div className="micro">
      <p>Микрофон: {status} | Громкость: {volume}</p>
      <button onClick={startMic}>Включить</button>
      <button onClick={stopMic}>Выключить</button>

      <button onClick={() => connect(streamRef.current)}>
        Установить соединение
      </button>
      {connected && (
        <>
          <p>соединение установлено</p>
          <audio ref={audioRef} autoPlay />
          <button onClick={disconnect}>Отключить</button>
        </>
      )}
    </div>
  );
}

export default App;
