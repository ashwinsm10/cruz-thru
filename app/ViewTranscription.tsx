import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import * as FileSystem from 'expo-file-system'; 

type StudyMaterialScreenRouteProp = RouteProp<
  { StudyMaterial: { audioFile: string } }, 
  "StudyMaterial"
>;

type Props = {
  route: StudyMaterialScreenRouteProp;
};

export const ViewTranscription: React.FC<Props> = ({ route }) => {
  const { audioFile } = route.params;
  const [loading, setLoading] = useState(true);
  const [transcriptionText, setTranscriptionText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
  
      try {
        const audioFilePath = audioFile.file || audioFile;
        console.log("Audio file received:", audioFilePath);
  
        if (!audioFilePath) {
          throw new Error('Audio file path is invalid or undefined');
        }
  
        const fileInfo = await FileSystem.getInfoAsync(audioFilePath);
  
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }
  
        const formData = new FormData();
        
        const audioBlob = {
          uri: audioFilePath,
          type: 'audio/x-caf', 
          name: 'recording.caf',
        };
  
        formData.append('audio_file', audioBlob);
  
        console.log("Audio File URI:", audioFilePath);
  
        const response = await fetch("http://127.0.0.1:5000/transcribe", {
          method: "POST",
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
  
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
  
        const responseData = await response.json();
        console.log("Backend Response:", responseData);
  
        setTranscriptionText(responseData.transcription.text);
      } catch (err) {
        setError(`Error fetching data: ${err.message}`);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [audioFile]);

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

    return (
      <View style={styles.transcriptionContainer}>
        <Text style={styles.transcriptionTitle}>Transcription</Text>
        {transcriptionText ? (
          <Text style={styles.transcriptionText}>{transcriptionText}</Text>
        ) : (
          <Text>No transcription available.</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
  transcriptionContainer: {
    padding: 20,
  },
  transcriptionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  transcriptionText: {
    fontSize: 16,
    color: "#333",
  },
});
