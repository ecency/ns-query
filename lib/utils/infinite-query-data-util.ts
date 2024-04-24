import { InfiniteData } from "@tanstack/react-query";

export namespace InfiniteQueryDataUtil {
  export function findIndexPairOfElement<T extends object>(
    data: InfiniteData<T[]>,
    comparator: (v: T) => boolean,
  ): [number, number] {
    let elementIndex = -1;
    const pageIndex = data.pages.findIndex((messages) => {
      elementIndex = messages.findIndex(comparator);
      return elementIndex > -1;
    });

    return [pageIndex, elementIndex];
  }

  export function replaceElementByIndexes<T extends object>(
    data: InfiniteData<T[]>,
    findComparator: (v: T) => boolean,
    mutationBeforeReplace: (v: T) => T,
  ) {
    const [pageIndex, targetElementIndex] = findIndexPairOfElement(
      data,
      findComparator,
    );

    const newPages = [...data.pages];

    newPages[pageIndex] = newPages[pageIndex].map((element, elementIndex) =>
      elementIndex === targetElementIndex
        ? mutationBeforeReplace(element)
        : element,
    );

    return {
      ...data,
      pages: newPages,
    };
  }

  export function pushElementToFirstPage<T extends object>(
    data: InfiniteData<T[]>,
    element: T,
    duplicationIgnoreFn?: (element: T) => boolean,
  ): InfiniteData<T[]> {
    if (
      typeof duplicationIgnoreFn === "function" &&
      data.pages[0].some(duplicationIgnoreFn)
    ) {
      return data;
    }

    return {
      ...data,
      pages: data.pages.map((page, index) =>
        index === 0 ? [...page, element] : page,
      ),
    };
  }

  export function safeDataUpdate<T extends object>(
    data: T | undefined,
    mutateData: (data: T) => T,
  ) {
    if (!data) {
      return data;
    }

    return mutateData(data);
  }

  export function flatten<T extends object>(data: InfiniteData<T[]>): T[] {
    return data.pages.reduce<T[]>((acc, page) => [...acc, ...page], []);
  }
}
