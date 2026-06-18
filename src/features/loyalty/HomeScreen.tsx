import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../auth/authStore';

export function HomeScreen() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logged in</Text>
      <TouchableOpacity style={styles.button} onPress={clearAuth}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  button: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  buttonText: {
    fontSize: 16,
  },
});
