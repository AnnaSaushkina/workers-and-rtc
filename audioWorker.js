self.onmessage = (e) => {
  const data = e.data;
  const volume = Math.sqrt(
    data.reduce((sum, x) => sum + x * x, 0) / data.length
  );
  self.postMessage(volume);
};
