import { useAuthStore } from "@/stores/AuthStore";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SplashScreen from "@/components/SplashScreen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import colors from "@/assets/styles/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const { user, isSignedIn } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      const timeout = setTimeout(() => {
        setAppReady(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [fontsLoaded]);

  // Auth Protection Guard
  useEffect(() => {
    if (!appReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inClientGroup = segments[0] === '(client)';
    const inDriverGroup = segments[0] === '(driver)';

    if (!isSignedIn) {
      if (!inAuthGroup) {
        router.replace('/(auth)' as any);
      }
    } else {
      if (user?.role === 'driver' && !inDriverGroup) {
        router.replace('/(driver)' as any);
      } else if (user?.role === 'client' && !inClientGroup) {
        router.replace('/(client)' as any);
      }
    }
  }, [isSignedIn, user, segments, appReady]);

  if (!appReady || !fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, backgroundColor: colors.background?.app || '#0f172a' }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background?.app || '#0f172a' },
          }}
        />
      </View>
    </QueryClientProvider>
  );
}
