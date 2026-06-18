import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePoints } from './usePoints';
import { useRewards } from './useRewards';
import { useRedeemReward } from './useRedeemReward';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ErrorView } from '../../components/ErrorView';
import type { Bounty, ApiError } from '../../api/types';

export function RewardsScreen() {
  const [lastRedeemedId, setLastRedeemedId] = useState<string | null>(null);

  const pointsQuery = usePoints();
  const rewardsQuery = useRewards();
  const redeemMutation = useRedeemReward();

  const isLoading = pointsQuery.isLoading || rewardsQuery.isLoading;
  const isError = pointsQuery.isError || rewardsQuery.isError;
  const errorMessage =
    ((pointsQuery.error ?? rewardsQuery.error) as ApiError | null)?.message ??
    'Something went wrong';

  function refetch() {
    if (pointsQuery.isError) pointsQuery.refetch();
    if (rewardsQuery.isError) rewardsQuery.refetch();
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

  const crPoints = pointsQuery.data?.points ?? 0;
  const rewards = rewardsQuery.data ?? [];

  function handleRedeem(bountyId: string) {
    redeemMutation.mutate(bountyId, {
      onSuccess: () => setLastRedeemedId(bountyId),
    });
  }

  function renderItem({ item }: { item: Bounty }) {
    const isThisItemPending =
      redeemMutation.isPending && redeemMutation.variables === item.id;

    // Belt-and-suspenders: server flag + live balance check from CR query
    const canAfford = crPoints >= item.needed_points;
    const isDisabled = !item.is_redeemable || !canAfford;

    const redeemError =
      redeemMutation.isError &&
      redeemMutation.variables === item.id
        ? ((redeemMutation.error as unknown as ApiError | null)?.message ?? 'Redemption failed')
        : null;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.rewardName}>{item.name}</Text>
          <Text style={styles.pointsCost}>{item.needed_points} pts</Text>
        </View>
        <Text style={styles.description}>{item.description}</Text>

        {lastRedeemedId === item.id ? (
          <Text style={styles.successText}>Redeemed!</Text>
        ) : redeemError ? (
          <Text style={styles.errorText}>{redeemError}</Text>
        ) : null}

        <Button
          label={isThisItemPending ? '' : 'Redeem'}
          loading={isThisItemPending}
          disabled={isDisabled}
          onPress={() => handleRedeem(item.id)}
          style={styles.redeemButton}
        />

        {isDisabled && !item.is_redeemable && (
          <Text style={styles.hint}>Not currently redeemable</Text>
        )}
        {isDisabled && item.is_redeemable && !canAfford && (
          <Text style={styles.hint}>
            {item.needed_points - crPoints} more points needed
          </Text>
        )}
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          rewards.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rewards available</Text>
          </View>
        }
      />
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
  list: {
    padding: 16,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rewardName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  pointsCost: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  redeemButton: {
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: -4,
  },
  successText: {
    fontSize: 14,
    color: '#2a7a2a',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
