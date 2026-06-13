interface ConnectionStatusProps {
  connected: boolean;
}

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div style={styles.wrapper}>
      <span style={{ ...styles.dot, background: connected ? 'var(--gain)' : 'var(--loss)' }} />
      <span style={styles.label}>{connected ? 'live' : 'disconnected'}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
  },
};
