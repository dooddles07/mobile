const { Stack } = require("expo-router/stack");

export default function RootLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false 
    }} />
  );
}
