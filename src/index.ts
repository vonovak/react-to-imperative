import type {
  JSXElementConstructor,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from 'react';
import React from 'react';

export type Props = Readonly<Record<string, any>>;

export type PropsExtractor<I extends Props, O extends Props = I> = (element: {
  props: I;
  type: ReactElement<I>['type'];
  depth: number;
}) => O | boolean;

export type ElementCreator = <I>(
  type: JSXElementConstructor<I>,
  props: PropsWithChildren<I>
) => ReactElement<I> | null;

export const inspectElements = <I extends Props, O extends Props = I>(
  inputReactElements: ReactNode | ReactNode[],
  opts:
    | PropsExtractor<I, O>
    | {
        propsExtractor: PropsExtractor<I, O>;
        maxDepth?: number;
        elementCreator?: ElementCreator;
      }
): O[] => {
  const {
    propsExtractor,
    maxDepth = 3,
    elementCreator = callSafe,
  } = typeof opts === 'function' ? { propsExtractor: opts } : opts;

  const extractedProps = extractFromElement<I, O>(
    inputReactElements,
    {
      maxDepth,
      elementCreator,
    },
    propsExtractor
  );

  return extractedProps;
};
export default inspectElements;

const extractFromElement = <I extends Props, O extends Props>(
  elementRoot: ReactNode | ReactNode[],
  opts: {
    maxDepth: number;
    elementCreator: ElementCreator;
  },
  propsExtractor: PropsExtractor<I, O>
): Array<O> => {
  // don't do this at home - it's not how React is meant to be used

  const stack: { element: ReactNode[] | ReactNode; depth: number }[] = [
    { element: elementRoot, depth: 0 },
  ];
  const results: Array<O> = [];

  while (stack.length > 0) {
    const { element, depth } = stack.shift()!;

    React.Children.forEach(element, (child) => {
      if (!React.isValidElement<I>(child)) {
        return;
      }

      const result = propsExtractor({
        type: child.type,
        props: child.props,
        depth,
      });
      const nextDepth = depth + 1;
      const isGettingTooDeep = nextDepth >= opts.maxDepth;
      if (typeof result === 'object') {
        results.push(result);
      } else if (result === true && !isGettingTooDeep) {
        // go one level deeper
        const { props, type } = child;
        if (typeof type === 'function') {
          const nestedElement = opts.elementCreator<I>(type, props);
          stack.push({ element: nestedElement, depth: nextDepth });
        } else {
          // Fragment or other element
          const children = child.props.children;
          if (children) {
            stack.push({ element: children, depth: nextDepth });
          }
        }
      }
    });
  }

  return results;
};

export const callSafe: ElementCreator = (type, props) => {
  try {
    // if the component is a pure function component, call it directly with props and return the result
    // @ts-expect-error Not all constituents of type 'JSXElementConstructor<I>' are callable.
    return type(props);
  } catch {
    // catches errors like "Invalid hook call" if you use hooks or "cannot call a class as a function" if you use class components
    return null;
  }
};
