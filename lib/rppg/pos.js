import * as math from "mathjs";
import { fft, util as fftUtil } from "fft-js";
import TimeSeries from "timeseries-analysis";
import { lowPassFilter } from "low-pass-filter";

const projectionMatrix = math.matrix([
  [0, 1, -1],
  [-2, 1, 1],
]);

function containsNaN(arr) {
  return arr.some((value) => value === false || Number.isNaN(value));
}

function findIndexOfMaxValue(array) {
  return array
    .map((value, index) => [value, index])
    .reduce((max, current) => (current[0] > max[0] ? current : max))[1];
}

function filterAndCalculateFrequency(arr, frequencyRange, multiplier) {
  arr = arr.filter(
    (signal) =>
      signal.frequency > frequencyRange.min &&
      signal.frequency < frequencyRange.max
  );
  if (arr.length > 0) {
    const maxIndex = findIndexOfMaxValue(arr.map((signal) => signal.magnitude));
    const frequency = arr[maxIndex].frequency * multiplier;
    console.log(`Frequency: ${frequency}`);
    return frequency;
  }
  return -1;
}

function logarithmicFit(arr) {
  return arr
    .map((value) => {
      const logValue = 100 - Math.log(100 * Math.abs(value));
      return logValue === Infinity ? null : logValue;
    })
    .filter((value) => value !== null);
}

function calculateForecast(arr, degree) {
  if (arr.length < degree) {
    return -1;
  }
  const timeSeries = new TimeSeries.main(TimeSeries.adapter.fromArray(arr));
  const coefficients = timeSeries.ARLeastSquare({ degree });
  return coefficients.reduce((forecast, coeff, index) => {
    return (
      forecast + timeSeries.data[timeSeries.data.length - 1 - index][1] * coeff
    );
  }, 0);
}

export function POS(signal, windowSize) {
  let H = new Array(signal.length).fill(0);
  signal = signal.slice(50);

  for (let i = 0; i < signal.length - windowSize; i++) {
    let windowedSignal = signal
      .slice(i, i + windowSize)
      .map((v) => [v.R, v.G, v.B]);
    windowedSignal = math.transpose(windowedSignal);
    const mean = math.mean(windowedSignal, 1);
    const normalizedSignal = math.multiply(
      math.inv(math.diag(mean)),
      windowedSignal
    );

    let S = math.multiply(projectionMatrix, normalizedSignal)._data;
    const std = [1, math.std(S[0]) / math.std(S[1])];
    let P = math.multiply(std, S);
    P = math.subtract(P, math.divide(math.mean(P), math.std(P)));
    P = math.add(H.slice(i, i + windowSize), P);

    H.splice(i, windowSize, ...P);
  }

  lowPassFilter(H, 2, 12, 1);

  if (containsNaN(H)) {
    return [H, [], -1, -1, -1];
  }

  try {
    const phasors = fft(H);
    const frequencies = fftUtil.fftFreq(phasors, 3);
    const magnitudes = fftUtil.fftMag(phasors);
    const frequencyData = frequencies.map((frequency, index) => ({
      frequency,
      magnitude: magnitudes[index],
    }));

    const bpm = filterAndCalculateFrequency(
      frequencyData,
      { min: 0.8, max: 2 },
      60
    );
    const rr = filterAndCalculateFrequency(
      frequencyData,
      { min: 0.2, max: 0.5 },
      60
    );
    const rValues = signal.map((s) => s.R);
    lowPassFilter(rValues, 5.5, 12, 1);
    const logFittedRValues = logarithmicFit(rValues);
    const oSat = calculateForecast(logFittedRValues, 9);

    return [H, frequencyData, bpm, rr, oSat];
  } catch (error) {
    console.error(error);
    return [H, [], -1, -1, -1];
  }
}
