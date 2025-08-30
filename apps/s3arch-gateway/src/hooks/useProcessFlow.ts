import { useState, useEffect, useCallback } from 'react';
import { TIM3_PROCESSES } from '../ao/processes';
import { queryBalance } from '../ao/client';
import { useArweaveWallet } from '../wallet/useArweaveWallet';

export interface ProcessData {
  id: string;
  name: string;
  processId: string;
  balance: string | null;
  status: 'active' | 'inactive' | 'processing';
  lastUpdate: number;
}

export interface TransactionFlow {
  id: string;
  type: 'mint' | 'burn';
  amount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  steps: Array<{
    processId: string;
    action: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    timestamp: number;
  }>;
}

export function useProcessFlow() {
  const { address, isConnected } = useArweaveWallet();
  const [processes, setProcesses] = useState<ProcessData[]>([]);
  const [transactions, setTransactions] = useState<TransactionFlow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize process data
  const initializeProcesses = useCallback(async () => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const processConfigs = [
        {
          id: 'usda',
          name: 'USDA Token',
          processId: TIM3_PROCESSES.usda.processId,
        },
        {
          id: 'coordinator',
          name: 'TIM3 Coordinator', 
          processId: TIM3_PROCESSES.coordinator.processId,
        },
        {
          id: 'lockManager',
          name: 'Lock Manager',
          processId: TIM3_PROCESSES.lockManager.processId,
        },
        {
          id: 'tokenManager', 
          name: 'Token Manager',
          processId: TIM3_PROCESSES.tokenManager.processId,
        },
        {
          id: 'stateManager',
          name: 'State Manager',
          processId: TIM3_PROCESSES.stateManager.processId,
        },
      ];

      // Fetch balances for processes that have balances
      const processData = await Promise.all(
        processConfigs.map(async (config) => {
          let balance: string | null = null;
          
          // Only fetch balance for token processes (USDA and TIM3)
          if (config.id === 'usda' || config.id === 'tokenManager') {
            try {
              balance = await queryBalance(
                config.processId,
                TIM3_PROCESSES.coordinator.scheduler, // Use coordinator scheduler
                address
              );
              console.log(`Balance for ${config.name}:`, balance);
            } catch (balanceError) {
              console.warn(`Could not fetch balance for ${config.name}:`, balanceError);
              balance = config.id === 'usda' ? '0 USDA' : '0 TIM3';
            }
          }

          return {
            id: config.id,
            name: config.name,
            processId: config.processId,
            balance,
            status: 'active' as const,
            lastUpdate: Date.now(),
          };
        })
      );

      setProcesses(processData);
    } catch (err) {
      console.error('Error initializing processes:', err);
      setError('Failed to initialize process data');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  // Add a transaction to track
  const addTransaction = useCallback((transaction: Omit<TransactionFlow, 'id' | 'timestamp' | 'steps'>) => {
    const newTransaction: TransactionFlow = {
      ...transaction,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      steps: [
        {
          processId: TIM3_PROCESSES.coordinator.processId,
          action: transaction.type === 'mint' ? 'MintTIM3' : 'BurnTIM3',
          status: 'pending',
          timestamp: Date.now(),
        },
        {
          processId: TIM3_PROCESSES.lockManager.processId,
          action: transaction.type === 'mint' ? 'LockCollateral' : 'UnlockCollateral',
          status: 'pending',
          timestamp: Date.now(),
        },
        {
          processId: TIM3_PROCESSES.tokenManager.processId,
          action: transaction.type === 'mint' ? 'Mint' : 'Burn',
          status: 'pending',
          timestamp: Date.now(),
        },
        {
          processId: TIM3_PROCESSES.stateManager.processId,
          action: 'UpdateState',
          status: 'pending',
          timestamp: Date.now(),
        },
      ],
    };

    setTransactions(prev => [...prev, newTransaction]);
    
    // Simulate transaction progression
    simulateTransactionFlow(newTransaction.id);

    return newTransaction.id;
  }, []);

  // Simulate transaction flow progression
  const simulateTransactionFlow = useCallback((transactionId: string) => {
    const delays = [1000, 2000, 3000, 4000]; // Delays for each step
    
    delays.forEach((delay, index) => {
      setTimeout(() => {
        setTransactions(prev => prev.map(tx => {
          if (tx.id === transactionId) {
            const updatedSteps = [...tx.steps];
            if (updatedSteps[index]) {
              updatedSteps[index] = {
                ...updatedSteps[index],
                status: index === delays.length - 1 ? 'completed' : 'processing',
                timestamp: Date.now(),
              };
            }
            
            // Update overall transaction status
            const allCompleted = updatedSteps.every(step => step.status === 'completed');
            const anyFailed = updatedSteps.some(step => step.status === 'failed');
            
            let newStatus: TransactionFlow['status'] = 'processing';
            if (allCompleted) newStatus = 'completed';
            else if (anyFailed) newStatus = 'failed';
            
            return {
              ...tx,
              status: newStatus,
              steps: updatedSteps,
            };
          }
          return tx;
        }));

        // Update process status to show activity
        if (index < delays.length) {
          const processMap: Record<number, string> = {
            0: 'coordinator',
            1: 'lockManager', 
            2: 'tokenManager',
            3: 'stateManager',
          };
          
          const processId = processMap[index];
          if (processId) {
            setProcesses(prev => prev.map(process => 
              process.id === processId
                ? { ...process, status: 'processing' as const, lastUpdate: Date.now() }
                : process
            ));
            
            // Reset status after a short delay
            setTimeout(() => {
              setProcesses(prev => prev.map(process => 
                process.id === processId
                  ? { ...process, status: 'active' as const }
                  : process
              ));
            }, 500);
          }
        }
      }, delay);
    });
  }, []);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      const updatedProcesses = await Promise.all(
        processes.map(async (process) => {
          if (process.id === 'usda' || process.id === 'tokenManager') {
            try {
              const balance = await queryBalance(
                process.processId,
                TIM3_PROCESSES.coordinator.scheduler,
                address
              );
              return { ...process, balance, lastUpdate: Date.now() };
            } catch (err) {
              console.warn(`Balance refresh failed for ${process.name}:`, err);
              return process;
            }
          }
          return process;
        })
      );
      
      setProcesses(updatedProcesses);
    } catch (err) {
      console.error('Error refreshing balances:', err);
    }
  }, [isConnected, address, processes]);

  // Initialize on mount and when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      initializeProcesses();
    }
  }, [isConnected, address, initializeProcesses]);

  // Auto-refresh balances every 30 seconds
  useEffect(() => {
    if (isConnected && processes.length > 0) {
      const interval = setInterval(refreshBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, processes.length, refreshBalances]);

  return {
    processes,
    transactions,
    isLoading,
    error,
    addTransaction,
    refreshBalances,
    connected: isConnected,
  };
}
