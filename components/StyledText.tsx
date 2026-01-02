// Dilo App - Styled Text Component
import React from 'react';
import { Text } from 'react-native';

interface MonoTextProps {
  style?: any;
  children?: React.ReactNode;
}

export function MonoText(props: MonoTextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
}
