/**
 * Copied from https://medium.com/@oarthurnardi/list-comprehensions-in-typescript-2a32dbea1405
 * Instructions can be found there
 * @param list List of items
 * @param callback Function hat acts as a filter
 * @returns A List built according to the callback function
 */
export function listComprehension<T>(list: T[], callback: (item: T) => boolean): T[] {
    return list.filter(callback).map((item) => item);
}
