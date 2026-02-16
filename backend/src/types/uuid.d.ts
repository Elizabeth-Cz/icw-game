declare module 'uuid' {
  export function v1(): string;
  export function v3(name: string | Buffer, namespace: string | Buffer): string;
  export function v4(): string;
  export function v5(name: string | Buffer, namespace: string | Buffer): string;
  export function parse(uuid: string): Buffer;
  export function stringify(buffer: Buffer, offset?: number): string;
  export const v1: { [key: string]: any };
  export const v3: { [key: string]: any };
  export const v4: { [key: string]: any };
  export const v5: { [key: string]: any };
}
