declare module 'image-size' {
  export interface ISize {
    width: number | undefined;
    height: number | undefined;
    orientation?: number;
    type?: string;
  }

  export interface ISizeCalculationResult extends ISize {
    images?: ISize[];
  }
  export function imageSize(input: Buffer | string): ISizeCalculationResult;
}
