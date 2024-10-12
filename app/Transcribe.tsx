import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { Recording } from "expo-av/build/Audio";
import * as DocumentPicker from "expo-document-picker";

const { width, height } = Dimensions.get("window");

export const RecordVoiceScreen = () => {
  const [recording, setRecording] = useState<Recording | null>(null);
  const [recordings, setRecordings] = useState<
    { duration: string; file: string | null }[]
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const animationValue = useRef(new Animated.Value(0)).current;
  const volumeAnimation = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    return () => {
      if (recording) {
        recording
          .getStatusAsync()
          .then((status) => {
            if (status.isRecording) {
              recording.stopAndUnloadAsync().catch((err: Error) => {
                console.error("Failed to clean up recording", err);
              });
            }
          })
          .catch((err: Error) => {
            console.error("Failed to get recording status", err);
          });
      }
    };
  }, [recording]);

  useEffect(() => {
    Animated.spring(volumeAnimation, {
      toValue: volume,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [volume]);

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status === "granted") {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);

      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          const normalizedVolume = Math.max(
            0,
            Math.min(1, (status.metering + 160) / 160)
          );
          setVolume(normalizedVolume);
        }
      });

      await newRecording.startAsync();
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setVolume(0);

    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const { sound, status } = await recording.createNewLoadedSoundAsync();

      if (uri && status.durationMillis) {
        const newRecordingData = {
          duration: getDurationFormatted(status.durationMillis),
          file: uri,
        };
        setRecordings((prevRecordings) => [
          ...prevRecordings,
          newRecordingData,
        ]);
      }
    }
    setRecording(null);
  };

  const getDurationFormatted = (millis: number) => {
    const minutes = millis / 1000 / 60;
    const minutesDisplay = Math.floor(minutes);
    const seconds = Math.round((minutes - minutesDisplay) * 60);
    const secondsDisplay = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutesDisplay}:${secondsDisplay}`;
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*", "video/*"],
      });

      if (result.assets && result.assets.length > 0) {
        const { name, uri } = result.assets[0];
        const duration = await getFileDuration(uri);
        setRecordings((prevRecordings) => [
          ...prevRecordings,
          { duration: getDurationFormatted(duration), file: name },
        ]);
      }
    } catch (error) {
      console.error("Error picking audio or video file:", error);
    }
  };

  const getFileDuration = async (uri: string): Promise<number> => {
    const { sound, status } = await Audio.Sound.createAsync({ uri });
    await sound.unloadAsync();
    return status.durationMillis || 0;
  };

  const goToPreviousTranscriptions = () => {
    const simplifiedRecordings = recordings.map(({ duration, file }) => ({
      duration,
      file,
    }));

    navigation.navigate("Previous Transcriptions", {
      recordings: simplifiedRecordings,
    });
  };

  const baseSize = width * 0.3;
  const maxAdditionalSize = width * 0.2;
  const interpolatedSize = volumeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [baseSize, baseSize + maxAdditionalSize],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.previousTranscriptionsButton}
          onPress={goToPreviousTranscriptions}
        >
          <Icon name="history" size={24} color="#fff" />
          <Text style={styles.previousTranscriptionsText}>
            Previous Transcriptions
          </Text>
        </TouchableOpacity>

        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.microphoneButton,
              {
                transform: [
                  {
                    scale: animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
                borderRadius: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [width * 0.2, 10],
                }),
                width: interpolatedSize,
                height: interpolatedSize,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.microphoneButtonTouchable}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Icon name="microphone" size={60} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.recordingStatus}>
            {isRecording ? "Recording..." : "Tap to start recording"}
          </Text>

          <TouchableOpacity style={styles.importButton} onPress={handleImport}>
            <Icon name="file-upload-outline" size={24} color="#fff" />
            <Text style={styles.importButtonText}>Import from Files</Text>
          </TouchableOpacity>
        </View>
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
    padding: width * 0.05,
  },
  previousTranscriptionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    alignSelf: "flex-end",
    marginBottom: height * 0.03,
  },
  previousTranscriptionsText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  microphoneButton: {
    backgroundColor: "#1a1a1a",
    width: width * 0.4,
    height: width * 0.4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.03,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  microphoneButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  audioVisualizerContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  pulseCircle: {
    position: "absolute",
  },
  micIcon: {
    position: "absolute",
  },
  recordingStatus: {
    fontSize: 18,
    color: "#333",
    marginBottom: height * 0.03,
  },
  importButton: {
    paddingHorizontal: width * 0.04,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  importButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});
