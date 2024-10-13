import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  AccessibilityInfo,
  ScrollView,
  Dimensions,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlashcardsScreen } from "./ViewFlashcards";
const { width, height } = Dimensions.get("window");

type StudyMaterialScreenRouteProp = RouteProp<
  { StudyMaterial: { audioFile: string } },
  "StudyMaterial"
>;

type Props = {
  route: StudyMaterialScreenRouteProp;
};

interface Flashcard {
  question: string;
  answer: string;
}

export const StudyMaterialScreen: React.FC<Props> = ({ route }) => {
  const { audioFile } = route.params;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [flashcardsData, setFlashcardsData] = useState<Flashcard[]>([]);
  const [transcriptionText, setTranscriptionText] = useState<string | null>(
    null
  );
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const storedData = await AsyncStorage.getItem(audioFile);

        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setTranscriptionText(parsedData.transcription);
          setSummaryText(parsedData.summary);
          setFlashcardsData(parsedData.flashcards);
          setLoading(false);
          return;
        }

        const fileInfo = await FileSystem.getInfoAsync(audioFile);

        if (!fileInfo.exists) {
          throw new Error("File does not exist");
        }

        const formData = new FormData();

        const audioBlob = {
          uri: audioFile,
          type: "audio/x-caf",
          name: "recording.caf",
        };

        formData.append("audio_file", audioBlob);

        const response = await fetch("http://10.0.0.124:5001/transcribe", {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const responseData = await response.json();

        const transcription = responseData.transcription;
        const summary = responseData.lecture_notes;
        const flashcards = responseData.flashcards;

        await AsyncStorage.setItem(
          audioFile,
          JSON.stringify({
            transcription,
            summary,
            flashcards,
          })
        );

        setTranscriptionText(transcription);
        setSummaryText(summary);
        setFlashcardsData(flashcards);
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [audioFile]);

  const announceScreenChange = (screenName: string) => {
    AccessibilityInfo.announceForAccessibility(`${screenName} screen loaded`);
  };

  useEffect(() => {
    const screenNames = ["Summary", "Flashcards", "Transcriptions"];
    announceScreenChange(screenNames[selectedIndex]);
  }, [selectedIndex]);

  const renderContent = () => {
    if (loading) {
      return (
        <View
          style={styles.loadingContainer}
          accessibilityLabel="Loading content"
        >
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText} accessibilityLabel={`Error: ${error}`}>
            {error}
          </Text>
        </View>
      );
    }

    switch (selectedIndex) {
      case 0:
        return summaryText ? (
          <ScrollView
            style={styles.contentContainer}
            accessibilityLabel="Summary content"
            accessible={true}
          >
            <Text style={styles.contentText}>{summaryText}</Text>
          </ScrollView>
        ) : (
          <Text accessibilityLabel="No summary available">
            No summary available
          </Text>
        );
      case 1:
        return <FlashcardsScreen flashcardsData={flashcardsData} />;
      case 2:
        return transcriptionText ? (
          <ScrollView
            style={styles.contentContainer}
            accessibilityLabel="Transcription content"
            accessible={true}
          >
            <Text style={styles.contentText}>{transcriptionText}</Text>
          </ScrollView>
        ) : (
          <Text accessibilityLabel="No transcription available">
            No transcription available
          </Text>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SegmentedControl
          values={["Summary", "Flashcards", "Transcriptions"]}
          selectedIndex={selectedIndex}
          onChange={(event) => {
            setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
          }}
          style={styles.segmentedControl}
          accessible={true}
          accessibilityLabel="Content selection"
          accessibilityHint="Double tap to switch between Summary, Flashcards, and Transcriptions"
        />
        {renderContent()}
      </View>
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
    paddingHorizontal: width * 0.05, 
    paddingVertical: height * 0.02, 
  },
  segmentedControl: {
    marginBottom: height * 0.02,  
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  contentContainer: {
    paddingHorizontal: width * 0.05, 
  },
  contentText: {
    fontSize: width * 0.04,   
    lineHeight: width * 0.06,
  },
});
