import React, { useState, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

export function AnimatedImage({ source, style, ...props }) {
  const [isLoading, setIsLoading] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    if (isLoading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerOpacity, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerOpacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isLoading, shimmerOpacity]);

  const handleLoad = () => {
    setIsLoading(false);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={style}>
      {isLoading && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.placeholder,
            { opacity: shimmerOpacity },
          ]}
        />
      )}
      <Animated.Image
        source={source}
        style={[StyleSheet.absoluteFill, { opacity }]}
        onLoad={handleLoad}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#E8E8E8',
  },
});
