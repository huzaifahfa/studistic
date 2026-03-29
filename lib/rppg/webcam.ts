/**
 * Initialize webcam stream into a <video> element.
 */
export async function initCamera(cameraEl: HTMLVideoElement): Promise<void> {
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { exact: cameraEl.width },
        height: { exact: cameraEl.height },
      },
      audio: false,
    });
  } catch (e) {
    console.error("Camera init error:", e);
  }
  if (!stream) {
    throw new Error("Could not obtain video from webcam.");
  }
  cameraEl.srcObject = stream;
  cameraEl.play();
}

/**
 * Split raw ImageData pixel array into separate R, G, B arrays.
 */
export function toRGB(data: Uint8ClampedArray): [number[], number[], number[]] {
  const R: number[] = [];
  const G: number[] = [];
  const B: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    R.push(data[i]);
    G.push(data[i + 1]);
    B.push(data[i + 2]);
  }
  return [R, G, B];
}
