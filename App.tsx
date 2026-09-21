import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QuranCatalogProvider } from '@/context/QuranCatalogContext';
import { AppStateProvider } from '@/context/AppStateContext';
import AppNavigator from '@/navigation/AppNavigator';
import ErrorBoundary from '@/components/ErrorBoundary';

function AppContent() {
  return (
    <ErrorBoundary>
      <AppNavigator />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QuranCatalogProvider>
        <AppStateProvider>
          <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
          <AppContent />
        </AppStateProvider>
      </QuranCatalogProvider>
    </SafeAreaProvider>
  );
}
