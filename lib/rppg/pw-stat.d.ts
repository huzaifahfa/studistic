declare module "pw-stat" {
  const stat: {
    cov(matrix: number[][]): number[][];
    [key: string]: any;
  };
  export default stat;
}
