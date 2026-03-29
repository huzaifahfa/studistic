import * as faceapi from "face-api.js";

let modelsLoaded = false;

/**
 * Load face-api.js models from /weights.
 * Uses TinyFaceDetector + FaceLandmark68TinyNet (weights available in /public/weights).
 */
export async function initFaceApi(weightsPath = "/weights"): Promise<void> {
  if (modelsLoaded) return;
  await faceapi.nets.tinyFaceDetector.loadFromUri(weightsPath);
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(weightsPath);
  modelsLoaded = true;
}

export interface RGBSample {
  R: number;
  G: number;
  B: number;
}

/**
 * Detect faces in a video frame and extract mean RGB values from the face region.
 * Returns null if no face is detected.
 *
 * @param video  - The <video> element to sample from
 * @param canvas - An overlay <canvas> element (same dimensions as the video) for drawing detections
 */
export async function extractFaceRGB(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<RGBSample | null> {
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

  let results = await faceapi.detectAllFaces(video, options);
  if (results.length === 0) return null;

  const dims = faceapi.matchDimensions(canvas, video, true);
  results = faceapi.resizeResults(results, dims);
  faceapi.draw.drawDetections(canvas, results);

  // Extract the first detected face as a canvas
  const faceCanvases = await faceapi.extractFaces(video, results);
  if (faceCanvases.length === 0) return null;

  const faceCanvas = faceCanvases[0];
  const ctx = faceCanvas.getContext("2d");
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, faceCanvas.width, faceCanvas.height);
  const { data } = imageData;

  let R = 0, G = 0, B = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    R += data[i];
    G += data[i + 1];
    B += data[i + 2];
  }

  return {
    R: R / pixelCount,
    G: G / pixelCount,
    B: B / pixelCount,
  };
}
