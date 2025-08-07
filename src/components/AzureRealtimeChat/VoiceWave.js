import { useEffect, useRef } from "react";

const VoiceWave = ({ stream }) => {
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);
  const barsRef = useRef([]);

  useEffect(() => {
    if (!stream) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 32;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      const values = dataArray.slice(0, barsRef.current.length);
      values.forEach((v, i) => {
        const height = (v / 255) * 100;
        const bar = barsRef.current[i];
        if (bar) {
          bar.style.height = `${height}%`;
        }
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      analyser.disconnect();
      source.disconnect();
      audioCtx.close();
    };
  }, [stream]);

  const bars = Array.from({ length: 10 });

  return (
    <div className="wave">
      {bars.map((_, i) => (
        <span key={i} ref={(el) => (barsRef.current[i] = el)} className="bar" />
      ))}
      <style jsx>{`
        .wave {
          display: flex;
          align-items: flex-end;
          height: 1rem;
          gap: 2px;
        }
        .bar {
          width: 3px;
          background-color: #3b82f6;
          display: inline-block;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default VoiceWave;
