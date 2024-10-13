import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { FlashcardsScreen } from "./ViewFlashcards";
import { SummaryScreen } from "./ViewSummary";

type StudyMaterialScreenRouteProp = RouteProp<
  { StudyMaterial: { audioFile: File } }, 
  "StudyMaterial"
>;

type Props = {
  route: StudyMaterialScreenRouteProp;
};

interface ParsedSummaryData {
  title: string;
  mainPoints: string[];
  additionalInfo?: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

export const StudyMaterialScreen: React.FC<Props> = ({ route }) => {
  const { audioFile } = route.params; 
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<ParsedSummaryData | null>(
    null
  );
  const [flashcardsData, setFlashcardsData] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const formData = new FormData();
      formData.append("audio_file", audioFile);

      console.log("Audio File:", audioFile);
      console.log("FormData:", formData.get("audio_file"));

      try {
        const response = await fetch("http://10.0.0.124:5000/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const responseData = await response.json();
        console.log("Backend Response:", responseData);
        const parsedData = parseSummaryData(responseData.transcription);
        setSummaryData(parsedData);
      } catch (err) {
        setError("Failed to fetch data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [audioFile]);

  const parseSummaryData = (data: any): ParsedSummaryData => {
    return {
      title: data?.title || "Summary",
      mainPoints: data?.main_points || [],
      additionalInfo: data?.additional_info || "",
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading...</Text>
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
        return summaryData ? (
          <SummaryScreen summaryData={summaryData} />
        ) : (
          <Text>No summary available</Text>
        );
      case 1:
        return <FlashcardsScreen flashcardsData={flashcardsData} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SegmentedControl
          values={["Summary", "Flashcards"]}
          selectedIndex={selectedIndex}
          onChange={(event) => {
            setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
          }}
          style={styles.segmentedControl}
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
    padding: 20,
  },
  segmentedControl: {
    marginBottom: 20,
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
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});
