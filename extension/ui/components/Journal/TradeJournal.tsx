import React from 'react';
import { cn } from '../../../shared/utils';
import type { JournalStats, JournalSignal } from '../../state/types';
import styles from './TradeJournal.module.css';

interface TradeJournalProps {
    stats: JournalStats | null;
    history: JournalSignal[];
    onRefresh: () => void;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({ stats, history, onRefresh }) => {
    return (
        <div className={styles.container}>
            {/* Stats Header */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Win Rate</span>
                    <span className={cn(styles.statValue, (stats?.winRate || 0) >= 50 ? styles.positive : styles.negative)}>
                        {stats?.winRate || 0}%
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Trades</span>
                    <span className={styles.statValue}>{stats?.totalTrades || 0}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Accuracy</span>
                    <span className={styles.statValue}>{stats?.winRate || 0}%</span>
                </div>
            </div>

            {/* History List */}
            <div className={styles.historySection}>
                <div className={styles.historyHeader}>
                    <span className={styles.sectionTitle}>Recent Signals</span>
                    <button onClick={onRefresh} className={styles.refreshBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                        </svg>
                    </button>
                </div>

                <div className={styles.scrollArea}>
                    {history.length === 0 ? (
                        <div className={styles.emptyState}>No trades logged yet</div>
                    ) : (
                        history.map((trade) => (
                            <div key={trade.id} className={styles.tradeItem}>
                                <div className={styles.tradeInfo}>
                                    <span className={styles.tradeSymbol}>{trade.symbol}</span>
                                    <span className={cn(styles.tradeType, trade.type === 'BUY' ? styles.buy : styles.sell)}>
                                        {trade.type}
                                    </span>
                                </div>
                                <div className={styles.tradeDetails}>
                                    <span className={styles.tradePrice}>@{trade.price.toFixed(2)}</span>
                                    <span className={cn(styles.tradeOutcome, styles[trade.outcome.toLowerCase()])}>
                                        {trade.outcome}
                                    </span>
                                </div>
                                <div className={styles.tradeTime}>
                                    {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
