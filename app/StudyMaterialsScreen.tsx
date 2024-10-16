import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  AccessibilityInfo,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  Animated,
} from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { FlashcardsScreen } from "./ViewFlashcards";
import { askQuestion, fetchData } from "./apiHelpers";
import { SummaryComponent } from "./ViewSummary";
import { TranscriptionComponent } from "./ViewTranscription";
import ExpandableAnswerPanel from "./ExpandableAnswerPanel";

const { width, height } = Dimensions.get("window");

export const StudyMaterialScreen = ({ route }) => {
  const { audioFile } = route.params;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    flashcards: [],
    transcription: null,
    summary: null,
  });
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [showQuestionBar, setShowQuestionBar] = useState(false);

  const scrollViewRef = useRef(null);
  const questionInputRef = useRef(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData(audioFile, setData, setError, setLoading);

    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        Animated.timing(keyboardHeight, {
          duration: event.duration || 250,
          toValue: event.endCoordinates.height,
          useNativeDriver: false,
        }).start();
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        Animated.timing(keyboardHeight, {
          duration: event.duration || 250,
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [audioFile, keyboardHeight]);

  useEffect(() => {
    const screenNames = ["Summary", "Flashcards", "Transcriptions"];
    AccessibilityInfo.announceForAccessibility(
      `${screenNames[selectedIndex]} screen loaded`
    );
  }, [selectedIndex]);

  const handleAskQuestion = useCallback(async () => {
    if (!data.summary || !question) return;
    setAskingQuestion(true);
    setAnswer(null);
    setError(null);
    Keyboard.dismiss();
    try {
      const answerData = await askQuestion(data.summary, question);
      if (answerData && typeof answerData === "object") {
        setAnswer(answerData.answer || JSON.stringify(answerData));
      } else if (typeof answerData === "string") {
        setAnswer(answerData);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Error in handleAskQuestion:", err);
      setError(err.message || "Failed to get an answer");
    } finally {
      setAskingQuestion(false);
    }
  }, [data.summary, question]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    switch (selectedIndex) {
      case 0:
        return <SummaryComponent summaryText={data.summary} />;
      case 1:
        return <FlashcardsScreen flashcardsData={data.flashcards} />;
      case 2:
        return (
          <TranscriptionComponent transcriptionText={data.transcription} />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <SegmentedControl
          values={["Summary", "Flashcards", "Transcriptions"]}
          selectedIndex={selectedIndex}
          onChange={(event) =>
            setSelectedIndex(event.nativeEvent.selectedSegmentIndex)
          }
          style={styles.segmentedControl}
        />
        <ScrollView
          ref={scrollViewRef}
          style={styles.contentScrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
          <View style={styles.spacer} />
        </ScrollView>
        <Animated.View
          style={[
            styles.questionBarWrapper,
            {
              transform: [
                {
                  translateY: keyboardHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -1],
                  }),
                },
              ],
            },
          ]}
        >
          {showQuestionBar ? (
            <View style={styles.questionBarContainer}>
              <TextInput
                ref={questionInputRef}
                style={styles.questionInput}
                value={question}
                
                onChangeText={setQuestion}
                placeholder="Ask anything about the lecture..."
                
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 50);
                }}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAskQuestion}
                disabled={askingQuestion}
              >
                <Text style={styles.submitButtonText}>
                  {askingQuestion ? "..." : "Ask"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.askButton}
              onPress={() => {
                setShowQuestionBar(true);
                setTimeout(() => questionInputRef.current?.focus(), 100);
              }}
            >
              <Text style={styles.askButtonText}>Ask a Question</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
        <ExpandableAnswerPanel
          answer={answer}
          onClose={() => setAnswer(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  segmentedControl: {
    marginHorizontal: width * 0.05,
    marginVertical: height * 0.02,
    backgroundColor: "#8E8E93",
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.1,
  },
  spacer: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007AFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
  },
  errorText: {
    color: "red",
    fontSize: width * 0.04,
    textAlign: "center",
  },
  questionBarWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  askButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: width * 0.05,
    marginBottom: 10,
  },
  askButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  questionBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    marginHorizontal: width * 0.05,
    marginBottom: 10,
    borderColor: "#007AFF",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
