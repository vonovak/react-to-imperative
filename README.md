# react-to-imperative

Convert React (Native) components for imperative use.

## Why?

React is great for declarative UI, but React Native comes with many apis that have to be used imperatively, even though they also describe UI and declarative approach would fit them well.
For example: [ActionSheetIOS](https://reactnative.dev/docs/next/actionsheetios), [react-native-menu](https://github.com/react-native-menu/menu) or the old [PopupMenu](https://github.com/facebook/react-native/blob/6fa51e0c47413b8886b0ed04e4b909ca12b2717c/Libraries/ReactNative/NativeUIManager.js#L112).

This package serves as a bridge from declarative (React) to imperative by extracting props from React Elements.

<details>
  <summary>Read more motivation</summary>

Consider an example: In order to pass the right params to the imperative api of `ActionSheet`, you'll have to create array of string for the button titles. That can get quite tedious, for example:

```tsx
const titles: Array<string> = [];
if (user.isAdmin) {
  titles.push('Delete');
}
if (user.isModerator) {
  titles.push('Ban');
}
if (user.isAuthor) {
  titles.push('Edit');
}

showActionSheetWithOptions(
  {
    options: labels,
  },
  (selectedIndex) => {
    if (buttonIndex === 0) {
      // delete
    } else if (buttonIndex === 1) {
      // ban
    } else if (buttonIndex === 2) {
      // edit
    }
  }
);
```

Notice how we have a mutated array, the not-too-explicit relation between the `selectedIndex` and the corresponding `labels`, and multiple `if`s. We could refactor and make the code better, but it would still be imperative.

Let's take a look at how this could look when rendered with React Native. You'll notice that the code is cleaner: no need to mutate arrays, there is no hidden relationship between the `selectedIndex` and the corresponding `labels`, and there are no `if` statements.

```tsx
const buttonElements = (
  <>
    {user.isAdmin && (
      <Button
        title="Delete"
        onPress={() => {
          // delete
        }}
      />
    )}
    {user.isModerator && (
      <Button
        title="Ban"
        onPress={() => {
          // ban
        }}
      />
    )}
    {user.isAuthor && (
      <Button
        title="Edit"
        onPress={() => {
          // edit
        }}
      />
    )}
  </>
);
```

This package aims to combine the two approaches, because the second one is cleaner and easier to read but we still need to use the imperative apis of React Native.

With `react-to-imperative`, the code would look like this:

```tsx
const extractedProps = inspectElements(buttonElements, ({ props, type }) => {
  if (type === React.Fragment) {
    // if the element is a Fragment, return true to continue traversing deeper. The children (Buttons) will be covered by the next iteration.
    return true;
  }
  if (type === Button) {
    // we're interested in the titles and onPress handlers
    return { title: props.title, onPress: props.onPress };
  }
  return false; // ignore other components
});
const titles = extractedProps.map((props) => props.title);

showActionSheetWithOptions(
  {
    options: titles,
  },
  (selectedIndex) => {
    if (selectedIndex === undefined) {
      return;
    }
    const onPress = extractedProps[selectedIndex]?.onPress;
    onPress?.();
  }
);
```

</details>

## Installation

```sh
yarn add react-to-imperative
```

## Examples

There are many examples in the [test suite](./src/__tests__/index.test.tsx). Please do see them to understand what the package does. There is also a simple [example app](./example/src/App.tsx).

## Usage

```ts
import inspectElements from 'react-to-imperative';
```

### `inspectElements`

has the following signature:

```ts
type inspectElements<I extends Props, O extends Props = I> = (
  inputReactElements: ReactNode | ReactNode[],
  opts:
    | PropsExtractor<I, O>
    | {
        propsExtractor: PropsExtractor<I, O>;
        maxDepth?: number;
        elementCreator?: ElementCreator;
      }
) => O[];
```

The first arguments is an (array of) React elements from which you want to extract props. The second argument is either a props-extracting function or an object which allows advanced control (all options described below). It returns an array of props extracted from React elements you provide.

### `propsExtractor`

has the following signature:

```ts
type PropsExtractor<I extends Props, O extends Props = I> = (element: {
  props: I;
  type: ReactElement<I>['type'];
  depth: number;
}) => O | boolean;
```

This is a function that you implement. It accepts `({ props, type, depth })`. `props` is the props object, `type` is a component type (`div`, `View`, `React.Fragment` ...), `depth` is the current depth in the explored React tree. You should return:

- an object with props you want to extract if the provided React element is one you're interested in. Search will not carry on deeper in the React tree in this case (please open an issue if you need to change this).
- `true` to denote that the provided React element is of no interested to you but you want the search to carry on one level deeper in the React tree (in the element's `children`)
- `false` to denote you're not interested in exploring the provided part of React tree

### `maxDepth`

Controls the maximum depth of the React tree that will be explored. Defaults to 3.

### `elementCreator`

A function that, given `props` and `type`, creates a new React element. The default implementation is [here](./src/index.ts#L103). The default implementation simply calls `type(props)` and swallows any errors that might come if the limitations (see next paragraph) are violated.

### Limitations

The `inspectElements` function only functions correctly for pure function components. It does not work if you use hooks or if you use class components - those will be ignored by default.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
