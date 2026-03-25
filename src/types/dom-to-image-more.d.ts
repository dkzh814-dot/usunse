declare module "dom-to-image-more" {
  function toPng(node: HTMLElement, options?: Record<string, unknown>): Promise<string>;
  function toBlob(node: HTMLElement, options?: Record<string, unknown>): Promise<Blob>;
  export default { toPng, toBlob };
}
