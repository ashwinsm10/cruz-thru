import React, { useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Markdown from "react-native-markdown-display";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { height } = Dimensions.get("window");

interface ExpandableAnswerPanelProps {
  answer: string | null;
  onClose: () => void;
}

const ExpandableAnswerPanel: React.FC<ExpandableAnswerPanelProps> = ({
  answer,
  onClose,
}) => {
  const panelHeight = useSharedValue(0);

  useEffect(() => {
    if (answer) {
      panelHeight.value = withTiming(height * 0.4, { duration: 300 });
    }
  }, [answer]);

  const animatedPanelStyle = useAnimatedStyle(() => {
    return {
      height: panelHeight.value,
    };
  });

  const handleClose = () => {
    panelHeight.value = withTiming(0, { duration: 300 });
    onClose();
  };

  return (
    <Animated.View style={[styles.animatedPanel, animatedPanelStyle]}>
      {answer && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerTitle}>Answer:</Text>
          <ScrollView style={styles.answerScrollView}>
            <Markdown>{answer}</Markdown>
          </ScrollView>
          {/* Remove absolute positioning */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    overflow: "hidden",
  },
  answerContainer: {
    padding: 20,
    flex: 1, // Ensure the container takes up the full available space
  },
  answerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  answerScrollView: {
    flex: 1, // Let ScrollView take up remaining space
  },
  answerText: {
    fontSize: 16,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ExpandableAnswerPanel;
