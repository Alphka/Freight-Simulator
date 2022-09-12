declare type HTMLElementInstances = HTMLElementTagNameMap[keyof HTMLElementTagNameMap];
declare type WaitElementOptions = {
    /** @default false */
    multiple?: boolean;
    /**
     * Where to search
     * @default window.document
     */
    element?: HTMLElementInstances;
    /** How long the loop will last */
    expires?: number;
    /** @default true */
    noError?: boolean;
};
declare function WaitForElement<T extends keyof HTMLElementTagNameMap>(selector: T[]): Promise<HTMLElementTagNameMap[T]>;
declare function WaitForElement<T extends HTMLElementInstances>(selector: string[]): Promise<T>;
declare function WaitForElement<T extends keyof HTMLElementTagNameMap>(selector: T, options?: WaitElementOptions & {
    multiple?: false;
    expires?: number;
    noError?: false;
}): Promise<HTMLElementTagNameMap[T]>;
declare function WaitForElement<T extends keyof HTMLElementTagNameMap>(selector: T, options?: WaitElementOptions & {
    multiple: true;
    expires?: number;
    noError?: false;
}): Promise<NodeListOf<HTMLElementTagNameMap[T]>>;
declare function WaitForElement<T extends HTMLElementInstances>(selector: string, options?: WaitElementOptions & {
    multiple?: false;
    expires?: number;
    noError?: false;
}): Promise<T>;
declare function WaitForElement<T extends HTMLElementInstances>(selector: string, options?: WaitElementOptions & {
    multiple: true;
    expires?: number;
    noError?: false;
}): Promise<NodeListOf<T>>;
declare function WaitForElement<T extends keyof HTMLElementTagNameMap>(selector: T, options?: WaitElementOptions & {
    multiple?: false;
    expires: number;
    noError: true;
}): Promise<HTMLElementTagNameMap[T] & {
    isError: boolean;
}>;
declare function WaitForElement<T extends keyof HTMLElementTagNameMap>(selector: T, options?: WaitElementOptions & {
    multiple: true;
    expires: number;
    noError: true;
}): Promise<NodeListOf<HTMLElementTagNameMap[T]> & {
    isError: boolean;
}>;
declare function WaitForElement<T extends HTMLElementInstances>(selector: string, options?: WaitElementOptions & {
    multiple?: false;
    expires: number;
    noError: true;
}): Promise<T & {
    isError: boolean;
}>;
declare function WaitForElement<T extends HTMLElementInstances>(selector: string, options?: WaitElementOptions & {
    multiple: true;
    expires: number;
    noError: true;
}): Promise<NodeListOf<T> & {
    isError: boolean;
}>;
export default WaitForElement;
