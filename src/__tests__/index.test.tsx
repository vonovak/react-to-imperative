import React, { ReactNode } from 'react';
import { inspectElements, PropsExtractor } from '../index';

type WrappedButtonProps = {
  title: string;
  onPress?: () => void;
};
function WrappedButton({ title, onPress }: WrappedButtonProps) {
  return <button onClick={onPress}>{title}</button>;
}
function DoubleWrappedButton(props: WrappedButtonProps) {
  return <WrappedButton {...props} />;
}

function View({ children }: any) {
  return <div>{children}</div>;
}

const defaultExtractor: PropsExtractor<WrappedButtonProps> = ({
  props,
  type,
}) => {
  if (type === WrappedButton) {
    return props;
  }
  return true;
};

const extractProps = (node: ReactNode | ReactNode[]) => {
  return inspectElements(node, defaultExtractor);
};
const propsOne = { title: 'one', onPress: jest.fn() } as const;
const propsTwo = { title: 'two', onPress: jest.fn() } as const;
const propsThree = { title: 'three', onPress: jest.fn() } as const;

describe('extractProps', () => {
  it('extracts titles, onPresses when given an array of WrappedButton', () => {
    const propsArray = [
      { title: 'one', onPress: jest.fn() },
      { title: 'two', onPress: jest.fn(), disabled: true },
      { title: 'three', onPress: jest.fn(), destructive: true },
    ] as const;
    const titlesAndOnPresses = extractProps([
      ...propsArray.map((props) => <WrappedButton {...props} />),
    ]);

    expect(titlesAndOnPresses).toStrictEqual([
      {
        title: propsArray[0].title,
        onPress: propsArray[0].onPress,
      },
      {
        title: propsArray[1].title,
        onPress: propsArray[1].onPress,
        disabled: true,
      },
      {
        title: propsArray[2].title,
        onPress: propsArray[2].onPress,
        destructive: true,
      },
    ]);
  });

  it('works for single child element', () => {
    const props = { title: 'one', onPress: jest.fn() };
    const propsTwo = { title: 'two', onPress: jest.fn() };
    expect(extractProps(<WrappedButton {...props} />)).toStrictEqual([props]);
    expect(extractProps(<DoubleWrappedButton {...propsTwo} />)).toStrictEqual([
      propsTwo,
    ]);
  });

  it('works when child elements are wrapped in a Fragment', () => {
    const props = { title: 'one', onPress: jest.fn() };
    const propsTwo = { title: 'two', onPress: jest.fn() };

    expect(
      inspectElements(
        <>
          <WrappedButton {...props} />
          <React.Fragment />
          <>
            <DoubleWrappedButton {...propsTwo} />
          </>
        </>,
        { maxDepth: 4, propsExtractor: defaultExtractor }
      )
    ).toStrictEqual([props, propsTwo]);
  });

  it('limits the depth to the value of maxDepth param', () => {
    const props = { title: 'one', onPress: jest.fn() };

    const TripleWrappedButton = (props: WrappedButtonProps) => (
      <DoubleWrappedButton {...props} />
    );
    const FourWrappedButton = (props: WrappedButtonProps) => (
      <TripleWrappedButton {...props} />
    );

    expect(
      inspectElements(
        <>
          <WrappedButton {...props} />
          <DoubleWrappedButton {...props} title={'2'} />
          <TripleWrappedButton {...props} title={'3'} />
          {/* last is ignored */}
          <FourWrappedButton {...props} title={'4'} />
        </>,
        {
          maxDepth: 4,
          propsExtractor: defaultExtractor,
        }
      )
    ).toStrictEqual([
      props,
      { ...props, title: '2' },
      { ...props, title: '3' },
    ]);
  });

  it('works for react host components', () => {
    expect(
      inspectElements(<button {...propsOne} />, ({ props, type }) => {
        if (type === 'button') {
          return props;
        }
        return false;
      })
    ).toStrictEqual([propsOne]);
  });

  it('ignores when hook / class component is used in the provided components (they might be present for styling purposes and actually rendered elsewhere)', () => {
    function MyComponent({
      title,
      onPress,
    }: {
      title: string;
      onPress: () => void;
    }) {
      const [titleFromState] = React.useState('from state hook');
      return <WrappedButton title={titleFromState + title} onPress={onPress} />;
    }
    const propsArray = [
      { title: 'one', onPress: jest.fn() },
      { title: 'two', onPress: jest.fn() },
    ];
    const items = propsArray.map((props) => <MyComponent {...props} />);

    // does not throw even if we use hooks and violate the rules
    // https://reactjs.org/docs/hooks-rules.html
    expect(extractProps(items)).toStrictEqual([]);

    class Component extends React.Component {
      render() {
        return <span style={{ height: 20, width: 20 }} />;
      }
    }
    // does not throw when class component is used
    expect(extractProps(<Component />)).toStrictEqual([]);
  });

  describe('corner cases', () => {
    const NullNestedComponent = () => null;

    it.each([null, undefined, <NullNestedComponent />])(
      'inspectElements works for case %#',
      (input) => {
        expect(extractProps(input)).toStrictEqual([]);
        expect(extractProps([input])).toStrictEqual([]);
      }
    );
  });

  it('works with multi-level nesting', () => {
    expect(
      inspectElements(
        <>
          <>
            <WrappedButton {...propsOne} />
          </>
          <div>
            <WrappedButton {...propsTwo} />
          </div>
          <View>
            <WrappedButton {...propsThree} />
          </View>
          <span>
            {/* span is ignored*/}
            <WrappedButton {...propsThree} title={'4'} />
          </span>
        </>,
        {
          maxDepth: 4,
          propsExtractor: ({ props, type }) => {
            if (type === WrappedButton) {
              return props;
            } else if (type === 'span') {
              return false;
            }
            return true;
          },
        }
      )
    ).toStrictEqual([propsOne, propsTwo, propsThree]);
  });

  it('ignores non-detected values', () => {
    const titlesAndOnPresses = extractProps([
      <></>,
      <>child</>,
      <span />,
      null,
      false,
      'hello',
      123,
    ]);
    expect(titlesAndOnPresses).toStrictEqual([]);
  });
});
