export interface CreateElementOptions {
    [attribute: string]: any;
    innerHTML?: string;
    innerText?: string;
    textContent?: string;
    src?: string;
    href?: string;
    alt?: string;
    title?: string;
    type?: string;
    class?: string;
    className?: string;
    id?: string;
    children?: Element[];
}
declare function CreateElement<T extends keyof HTMLElementTagNameMap>(tagName: T, options?: CreateElementOptions): HTMLElementTagNameMap[T];
declare function CreateElement(tagName: string, options?: CreateElementOptions): HTMLElement;
declare function CreateElement<T extends keyof HTMLElementTagNameMap>(options?: CreateElementOptions & {
    tagName?: T;
}): HTMLElementTagNameMap[T];
declare function CreateElement(options?: CreateElementOptions & {
    tagName?: string;
}): HTMLElement;
export default CreateElement;
