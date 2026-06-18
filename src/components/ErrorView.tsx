import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button label="Retry" onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  message: {
    fontSize: 15,
    color: '#c00',
    textAlign: 'center',
  },
  button: {
    minWidth: 120,
  },
});
