export function generateMobileFiles(projectName: string): Array<{ path: string; content: string }> {
  return [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: projectName,
        version: '0.1.0',
        main: 'expo-router/entry',
        scripts: { start: 'expo start', android: 'expo start --android', ios: 'expo start --ios' },
        dependencies: {
          expo: '~50.0.0',
          'expo-router': '^3.0.0',
          'expo-status-bar': '~1.11.1',
          react: '18.2.0',
          'react-native': '0.73.6',
        },
        devDependencies: {
          '@babel/core': '^7.20.0',
          '@types/react': '~18.2.45',
          typescript: '^5.1.3',
        },
      }, null, 2),
    },
    {
      path: 'app/_layout.tsx',
      content: `import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
`,
    },
    {
      path: 'app/index.tsx',
      content: `import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>${projectName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});
`,
    },
    { path: 'tsconfig.json', content: JSON.stringify({ extends: 'expo/tsconfig.base' }, null, 2) },
  ];
}
