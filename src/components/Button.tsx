import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'outline';
}

export function Button({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.outline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#000'} />
      ) : (
        <Text style={[styles.label, !isPrimary && styles.labelOutline]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#000',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#000',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  labelOutline: {
    color: '#000',
  },
});
