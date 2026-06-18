import { useCallback } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../auth/authStore';
import { queryClient } from '../../lib/queryClient';
import { usePoints } from './usePoints';
import { useProfile } from './useProfile';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ErrorView } from '../../components/ErrorView';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['cr'] });
    }, [])
  );

  const pointsQuery = usePoints();
  const profileQuery = useProfile();

  const isLoading = pointsQuery.isLoading || profileQuery.isLoading;
  const isError = pointsQuery.isError || profileQuery.isError;

  const errorMessage =
    (pointsQuery.error ?? profileQuery.error)?.message ??
    'Something went wrong';

  function refetch() {
    if (pointsQuery.isError) pointsQuery.refetch();
    if (profileQuery.isError) profileQuery.refetch();
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <ErrorView message={errorMessage} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const points = pointsQuery.data;
  const profile = profileQuery.data;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Points balance */}
        <Card style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Your points</Text>
          <Text style={styles.pointsValue}>{points?.points ?? '—'}</Text>
        </Card>

        {/* Profile info */}
        {profile ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{profile.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{profile.email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Customer ID</Text>
              <Text style={styles.fieldValue}>{profile.customer_id}</Text>
            </View>
          </Card>
        ) : null}

        {/* CTAs */}
        <View style={styles.ctas}>
          {/* TODO slice 5: open ScanModal */}
          <Button label="Scan to earn" onPress={() => { }} />
          <Button
            label="View rewards"
            variant="outline"
            onPress={() => navigation.navigate('Rewards')}
          />
        </View>

        {/* Logout */}
        <Button
          label="Log out"
          variant="outline"
          onPress={clearAuth}
          style={styles.logout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  pointsCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1,
  },
  section: {},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  fieldLabel: {
    fontSize: 15,
    color: '#555',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  ctas: {
    gap: 10,
  },
  logout: {
    marginTop: 8,
  },
});
