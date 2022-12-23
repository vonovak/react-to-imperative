import * as React from 'react';
import {
  ActionSheetProvider,
  useActionSheet,
} from '@expo/react-native-action-sheet';

import { StyleSheet, View, Text, SafeAreaView, Button } from 'react-native';
import inspectElements from 'react-to-imperative';

type ExtractedProps = { onPress: () => void; title: string };

function App() {
  const { showActionSheetWithOptions } = useActionSheet();
  const [items, setItems] = React.useState(['Item 1', 'Item 2', 'Item 3']);

  const Buttons = (
    <>
      <Button
        title="Add Item"
        onPress={() => {
          setItems(items.concat('Item ' + (items.length + 1)));
        }}
      />
      <Button
        onPress={() => {
          setItems(items.slice(0, items.length - 1));
        }}
        title="Delete Item"
      />
    </>
  );

  const presentActionSheet = () => {
    const extractedProps = inspectElements<
      ExtractedProps,
      { label: string; onPress: () => void }
    >(Buttons, ({ props, type }) => {
      if (type === Button) {
        return { label: props.title, onPress: props.onPress };
      }
      // if the element is a Fragment, return true to continue traversing. The children (Buttons) will be covered by the next iteration.
      return true;
    });
    const labels = extractedProps.map((props) => props.label).concat('Cancel');

    showActionSheetWithOptions(
      {
        options: labels,
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
      },
      (selectedIndex) => {
        if (selectedIndex === undefined) {
          return;
        }
        const onPress = extractedProps[selectedIndex]?.onPress;
        onPress?.();
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button title={'Show Action Sheet'} onPress={presentActionSheet} />
      {Buttons}
      {items.map((item, index) => (
        <View style={{ marginTop: 50 }} key={index + item}>
          <Text>{item}</Text>
        </View>
      ))}
    </SafeAreaView>
  );
}

export default function AppContainer() {
  return (
    <ActionSheetProvider>
      <App />
    </ActionSheetProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    justifyContent: 'center',
  },
});
