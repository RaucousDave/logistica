import colors from "@/assets/styles/theme";
import SplashScreen from "@/components/SplashScreen";
import { useAuthStore } from "@/stores/AuthStore";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useNavigation, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Toast from 'react-native-toast-message';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const navigation = useNavigation()
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
    const unsubscribe = navigation.addListener("state", (e) => {
      console.log(e.data.state)
    })
    return unsubscribe
  }, [navigation])

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

    // router.replace('/(client)/dashboard' as any);

    if (isSignedIn) {
      if (user?.role === 'driver' && !inDriverGroup) {
        router.replace('/(driver)/dashboard' as any);
      } else if (user?.role === 'client' && !inClientGroup) {
        router.replace('/(client)/dashboard' as any);
      }
    } else {
      return
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
        <Toast />
      </View>
    </QueryClientProvider>
  );
}
