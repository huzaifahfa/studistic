import {
  tanh,
  subtract,
  dotPow,
  dotMultiply,
  exp,
  dotDivide,
  transpose,
  abs,
  mean,
  multiply,
  diag,
  pow,
  size,
  random,
  dot,
  norm,
  sum,
  divide,
  clone,
} from "mathjs";
import stat from "pw-stat";
// @ts-ignore
import numeric from "numeric";

/**
 * FastICA algorithm for independent component analysis.
 * Separates mixed RGB signals into independent source components.
 *
 * @param signals - Mixed signals matrix. Each row is a signal, each column a sample.
 * @param options.maxIterations - Max iterations before giving up (default 1000)
 * @param options.debug - Print debug info (default false)
 * @param options.fun - Negentropy approximation: 'logcosh' or 'exp' (default 'logcosh')
 */
export function fastICA(
  signals: number[][],
  options: { maxIterations?: number; debug?: boolean; fun?: "logcosh" | "exp" } = {}
) {
  const { maxIterations = 1000, debug = false, fun = "logcosh" } = options;

  const negentropyFunctions: Record<
    string,
    { g: (u: any) => any; gp: (u: any) => any }
  > = {
    logcosh: {
      g: (u) => tanh(u),
      gp: (u) => subtract(1, dotPow(tanh(u), 2)),
    },
    exp: {
      g: (u) => dotMultiply(u, exp(dotDivide(dotPow(u, 2), -2))),
      gp: (u) =>
        dotMultiply(
          subtract(1, dotPow(u, 2)),
          exp(dotDivide(dotPow(u, 2), -2))
        ),
    },
  };

  // Use imported numeric instead of window.numeric
  const eigs = numeric.eig(stat.cov(transpose(signals)));
  let V = eigs.E.x;
  let D: number[] = eigs.lambda.x;

  // Covariance matrices are positive semi-definite; clamp tiny negatives from
  // numerical precision before taking the -1/2 power.
  D = abs(D) as number[];

  const mu: number[] = mean(signals, 1) as unknown as number[];
  const centered: number[][] = [];
  for (let i = 0; i < signals.length; i++) {
    centered.push(signals[i].map((v) => v - mu[i]));
  }

  const whitening = multiply(
    diag(D.map((d) => pow(d, -1 / 2) as number)),
    transpose(V)
  );
  const whitened = multiply(whitening, centered);

  const g = negentropyFunctions[fun].g;
  const gp = negentropyFunctions[fun].gp;

  const [N] = size(whitened) as number[];
  const M = (size(whitened) as number[])[1];

  let weights: any[] = [];
  for (let i = 0; i < N; i++) {
    weights.push(random([N]));
  }

  const totalIterations: number[] = [];

  for (let p = 0; p < N; p++) {
    let previousWeight = clone(weights[p]);

    if (debug) {
      console.log(`Computing component ${p + 1}/${N}`);
    }

    let converged = false;

    for (let i = 0; i < maxIterations; i++) {
      const cosTheta =
        (dot(previousWeight, weights[p]) as number) /
        ((norm(previousWeight) as number) * (norm(weights[p]) as number));
      const delta = 1 - abs(cosTheta);
      previousWeight = weights[p];

      if (debug && (i + 1) % 10 === 0) {
        console.log(`Iteration ${i + 1}/${maxIterations}, delta=${delta}`);
      }

      if (i !== 0 && (delta as number) < 5e-11) {
        totalIterations.push(i);
        converged = true;
        if (debug) console.log(`Converged on iteration ${i}`);
        break;
      }

      weights[p] = transpose(
        subtract(
          multiply(1 / M, whitened, transpose(g(multiply(weights[p], whitened)))),
          multiply(
            1 / M,
            sum(gp(multiply(weights[p], whitened))),
            transpose(weights[p])
          )
        )
      );

      for (let j = 0; j < p; j++) {
        weights[p] = subtract(
          weights[p],
          multiply(weights[p], transpose(weights[j]), weights[j])
        );
      }

      weights[p] = divide(weights[p], norm(weights[p]));
    }

    if (!converged) {
      totalIterations.push(maxIterations);
      if (debug) console.log("Stopped at maxIterations before converging");
    }
  }

  const source = multiply(weights, whitened);

  return {
    source,
    weights,
    whitening,
    iterations: totalIterations,
  };
}
