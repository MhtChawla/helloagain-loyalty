import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { useRedeemCoupon } from '../loyalty/useRedeemCoupon';
import { Button } from '../../components/Button';

export function ScanModal() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const scannedRef = useRef(false); // double-scan guard

  const { mutate: redeemCoupon, isPending, isSuccess, data } = useRedeemCoupon();

  useEffect(() => {
    requestPermission();
  }, []);

  function submit(code: string) {
    const trimmed = code.trim();
    if (!trimmed || isPending) return;
    redeemCoupon(trimmed, {
      onError: (err) => {
        navigation.goBack();
        Alert.alert('Invalid coupon', err.message ?? 'Invalid coupon code');
      },
    });
  }

  function handleBarcodeScan(result: BarcodeScanningResult) {
    if (scannedRef.current || isPending || isSuccess) return;
    scannedRef.current = true;
    submit(result.data);
  }

  // Success view
  if (isSuccess && data) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>+{data.points} points!</Text>
        <Text style={styles.successSub}>
          New balance: {data.cr_points} pts
        </Text>
        <Button
          label="Done"
          onPress={() => navigation.goBack()}
          style={styles.doneButton}
        />
      </View>
    );
  }


  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan to earn</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Camera viewfinder */}
        <View style={styles.cameraContainer}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScan}
            />
          ) : (
            <View style={styles.noCameraBox}>
              {permission === null ? (
                <ActivityIndicator />
              ) : permission.canAskAgain ? (
                <TouchableOpacity onPress={requestPermission}>
                  <Text style={styles.noCameraText}>
                    Tap to grant camera access
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.noCameraText}>
                  Camera access denied — use manual entry below
                </Text>
              )}
            </View>
          )}

          {isPending && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.scanningText}>Redeeming…</Text>
            </View>
          )}
        </View>

        {/* Manual entry — always visible */}
        <View style={styles.manual}>
          <Text style={styles.manualLabel}>Or enter code manually</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. YFQY2D"
            autoCapitalize="characters"
            value={manualCode}
            onChangeText={setManualCode}
            editable={!isPending}
            onSubmitEditing={() => submit(manualCode)}
            returnKeyType="done"
          />
          <Button
            label="Submit"
            loading={isPending}
            disabled={!manualCode.trim() || isPending}
            onPress={() => submit(manualCode)}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const CAMERA_HEIGHT = 260;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeText: {
    fontSize: 16,
    color: '#555',
  },
  cameraContainer: {
    height: CAMERA_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginBottom: 12,
  },
  noCameraBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noCameraText: {
    color: '#ccc',
    textAlign: 'center',
    fontSize: 15,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  scanningText: {
    color: '#fff',
    fontSize: 16,
  },
  manual: {
    gap: 10,
    marginTop: 8,
  },
  manualLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    letterSpacing: 2,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 32,
    gap: 12,
  },
  successIcon: {
    fontSize: 56,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
  },
  successSub: {
    fontSize: 16,
    color: '#555',
  },
  doneButton: {
    minWidth: 160,
    marginTop: 16,
  },
});
