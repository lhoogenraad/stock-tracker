import { useFlash } from '../hooks/useFlash';

interface PriceRowProps {
  symbol: string;
  price: number | undefined;
  updatedAt: string | undefined;
  onRemove: () => void;
}

export function PriceRow({ symbol, price, updatedAt, onRemove }: PriceRowProps) {
  const flash = useFlash(price);

  const flashStyle: React.CSSProperties =
    flash === 'gain'
      ? { background: 'var(--gain-flash)' }
      : flash === 'loss'
      ? { background: 'var(--loss-flash)' }
      : {};

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={styles.symbolCell}>{symbol}</td>
      <td style={{ ...styles.priceCell, ...flashStyle }}>
        {price !== undefined ? `$${price.toFixed(2)}` : '—'}
      </td>
      <td style={styles.timeCell}>
        {updatedAt ? new Date(updatedAt).toLocaleTimeString() : '—'}
      </td>
      <td style={styles.actionCell}>
        <button onClick={onRemove} style={styles.removeBtn}>✕</button>
      </td>
    </tr>
  );
}

const styles: Record<string, React.CSSProperties> = {
  symbolCell: {
    padding: '14px 16px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: '0.05em',
  },
  priceCell: {
    padding: '14px 16px',
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    transition: 'background 600ms ease-out',
  },
  timeCell: {
    padding: '14px 16px',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-secondary)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  actionCell: {
    padding: '14px 16px',
    textAlign: 'right',
    width: 40,
  },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 14,
    padding: 4,
  },
};
