import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
  SafeAreaView,
  Share,
  AccessibilityInfo,
  AccessibilityRole,
} from "react-native";
import Slider from "@react-native-community/slider";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { Recording } from "expo-av/build/Audio";
import { AVPlaybackStatus } from 'expo-av';
const { width, height } = Dimensions.get("window");

interface RecordingData {
  duration: string;
  file: string | null;
}

const formatDuration = (millis: number): string => {
  const minutes = Math.floor(millis / 1000 / 60);
  const seconds = Math.round((millis / 1000) % 60);
  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
};

const getFileDuration = async (uri: string): Promise<number> => {
  const { sound, status } = await Audio.Sound.createAsync({ uri });
  await sound.unloadAsync();
  return status.durationMillis || 0;
};

export const RecordVoiceScreen: React.FC = () => {
  const [recording, setRecording] = useState<Recording | null>(null);
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const animationValue = useRef(new Animated.Value(0)).current;
  const playbackInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const navigation = useNavigation();

  useEffect(() => {
    return () => {
      if (recording) stopRecording();
      if (sound) sound.unloadAsync();
      if (playbackInterval.current) clearInterval(playbackInterval.current);
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, [recording, sound]);

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status === "granted") {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 48000,
          numberOfChannels: 2,
          bitRate: 256000,
        },
        ios: {
          extension: ".caf",
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 48000,
          numberOfChannels: 2,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      });

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      await newRecording.startAsync();
      recordingInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      AccessibilityInfo.announceForAccessibility("Recording started");
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingInterval.current) clearInterval(recordingInterval.current);
  
    if (recording) {
      try {
        // Check if the recording is still ongoing before stopping
        const recordingStatus = await recording.getStatusAsync();
        if (recordingStatus.isRecording) {
          await recording.stopAndUnloadAsync();
        }
  
        const uri = recording.getURI();
  
        if (sound) {
          // Check if the sound is loaded before trying to unload
          const soundStatus = await sound.getStatusAsync();
          if (soundStatus.isLoaded) {
            await sound.unloadAsync();  // Only unload if sound is still loaded
          }
        }
  
        const { sound: newSound, status } = await recording.createNewLoadedSoundAsync();
        if (uri && status.isLoaded && status.durationMillis) {
          const newRecordingData =
           {
            duration: formatDuration(status.durationMillis),
            file: uri,
          };
          setRecordings((prev) => [...prev, newRecordingData]);
          setSound(newSound);
          setDuration(status.durationMillis / 1000);
        }
      } catch (error) {
        console.error("Error stopping or unloading recording:", error);
      }
    }
  
    setRecording(null);
    animateButtons();
    AccessibilityInfo.announceForAccessibility("Recording stopped");
  };
  
  

  const animateButtons = () => {
    Animated.spring(animationValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*", "video/*"],
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const duration = await getFileDuration(uri);

      if (sound) {
        await sound.unloadAsync();
      }

      try {
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false }
        );

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        setSound(newSound);
        setDuration( status.durationMillis / 1000);
        setRecordings((prev) => [
          ...prev,
          { duration: formatDuration(duration), file: uri },
        ]);
        animateButtons();
        AccessibilityInfo.announceForAccessibility(
          "Audio file imported successfully"
        );
      } catch (error) {
        console.error("Error loading audio:", error);
        AccessibilityInfo.announceForAccessibility(
          "Error importing audio file"
        );
      }
    }
  };

  const goToPreviousTranscriptions = useCallback(() => {
    navigation.navigate("Previous Transcriptions", { recordings });
  }, [navigation, recordings]);

  const updatePlaybackStatus = useCallback(async () => {
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setPosition(status.positionMillis / 1000);
        if (status.didJustFinish) {
          setIsPlaying(false);
          clearInterval(playbackInterval.current!);
          AccessibilityInfo.announceForAccessibility("Playback finished");
        }
      }
    }
  }, [sound]);

  const playPauseAudio = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        clearInterval(playbackInterval.current!);
        AccessibilityInfo.announceForAccessibility("Audio paused");
      } else {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          await sound.loadAsync({
            uri: recordings[recordings.length - 1].file,
          });
        }
        await sound.playAsync();
        playbackInterval.current = setInterval(updatePlaybackStatus, 1000);
        AccessibilityInfo.announceForAccessibility("Audio playing");
      }
      setIsPlaying(!isPlaying);
    }
  };

  const restartAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.playAsync();
      setIsPlaying(true);
      setPosition(0);
      playbackInterval.current = setInterval(updatePlaybackStatus, 1000);
      AccessibilityInfo.announceForAccessibility("Audio restarted");
    }
  };

  const shareAudio = async () => {
    const lastRecording = recordings[recordings.length - 1];
    if (lastRecording?.file) {
      await Share.share({ url: lastRecording.file });
      AccessibilityInfo.announceForAccessibility("Audio shared");
    }
  };

  const onSliderValueChange = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value * 1000);
      setPosition(value);
      AccessibilityInfo.announceForAccessibility(
        `Moved to ${formatDuration(value * 1000)}`
      );
    }
  };

  const goToStudyMaterials = useCallback(() => {
    const lastRecording = recordings[recordings.length - 1];
    if (lastRecording) {
      navigation.navigate("Study Materials", { audioFile: lastRecording.file });
    }
  }, [recordings, navigation]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      accessible={true}
      accessibilityLabel="Record Voice Screen"
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.previousTranscriptionsButton}
          onPress={goToPreviousTranscriptions}
          accessible={true}
          accessibilityLabel="View Previous Transcriptions"
          accessibilityRole="button"
        >
          <Icon name="history" size={24} color="#fff" />
          <Text style={styles.previousTranscriptionsText}>
            Previous Transcriptions
          </Text>
        </TouchableOpacity>

        <View style={styles.fixedControlsContainer}>
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
              },
            ]}
          >
            <TouchableOpacity
              style={styles.microphoneButtonTouchable}
              onPress={isRecording ? stopRecording : startRecording}
              accessible={true}
              accessibilityLabel={
                isRecording ? "Stop Recording" : "Start Recording"
              }
              accessibilityRole="button"
              accessibilityHint={
                isRecording
                  ? "Double tap to stop recording"
                  : "Double tap to start recording"
              }
            >
              <Icon
                name={isRecording ? "stop" : "microphone"}
                size={60}
                color="#000"
              />
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.recordingStatusContainer}>
            <Text style={styles.recordingStatus} accessibilityRole="text">
              {isRecording ? "Recording" : "Tap to start recording"}
            </Text>
            {isRecording && (
              <Text style={styles.recordingDuration} accessibilityRole="text">
                {` • ${formatDuration(recordingDuration * 1000)}`}
              </Text>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleImport}
              accessible={true}
              accessibilityLabel="Import Audio"
              accessibilityRole="button"
              accessibilityHint="Double tap to import an audio file"
            >
              <Icon name="file-upload-outline" size={30} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {recordings.length > 0 && !isRecording && (
          <Animated.View
            style={[
              styles.actionButtonsContainer,
              {
                opacity: animationValue,
                transform: [
                  {
                    translateY: animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.audioControlsRow}>
              <TouchableOpacity
                style={styles.audioControlButton}
                onPress={playPauseAudio}
                accessible={true}
                accessibilityLabel={isPlaying ? "Pause" : "Play"}
                accessibilityRole="button"
                accessibilityHint={
                  isPlaying
                    ? "Double tap to pause audio"
                    : "Double tap to play audio"
                }
              >
                <Icon
                  name={isPlaying ? "pause" : "play"}
                  size={30}
                  color="#000"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.audioControlButton}
                onPress={restartAudio}
                accessible={true}
                accessibilityLabel="Restart"
                accessibilityRole="button"
                accessibilityHint="Double tap to restart audio"
              >
                <Icon name="restart" size={30} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.audioControlButton}
                onPress={shareAudio}
                accessible={true}
                accessibilityLabel="Share"
                accessibilityRole="button"
                accessibilityHint="Double tap to share audio"
              >
                <Icon name="share-variant" size={30} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                onValueChange={onSliderValueChange}
                minimumTrackTintColor="#1a1a1a"
                maximumTrackTintColor="#000000"
                thumbTintColor="#1a1a1a"
                accessible={true}
                accessibilityLabel={`Audio progress: ${formatDuration(
                  position * 1000
                )} of ${formatDuration(duration * 1000)}`}
                accessibilityRole="adjustable"
                accessibilityHint="Slide to change audio position"
              />
              <View style={styles.timeContainer}>
                <Text style={styles.timeText} accessibilityRole="text">
                  {formatDuration(position * 1000)}
                </Text>
                <Text style={styles.timeText} accessibilityRole="text">
                  {formatDuration(duration * 1000)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={goToStudyMaterials}
              accessible={true}
              accessibilityLabel="View Summary"
              accessibilityRole="button"
              accessibilityHint="Double tap to view study materials"
            >
              <Text style={styles.actionButtonText}>View Summary</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
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
    paddingBottom: 0,
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
  fixedControlsContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: height * 0.4,
  },
  microphoneButton: {
    backgroundColor: "#fff",
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
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
  recordingStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: height * 0.03,
  },
  recordingStatus: {
    fontSize: 18,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#fff",
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: width * 0.05,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  actionButtonsContainer: {
    alignItems: "center",
    width: "100%",
    paddingTop: height * 0.02,
  },
  audioControlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  recordingDuration: {
    fontSize: 18,
    color: "#1a1a1a",
    fontWeight: "bold",
  },
  audioControlButton: {
    backgroundColor: "#fff",
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: width * 0.02,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sliderContainer: {
    width: "100%",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  timeText: {
    fontSize: 12,
    color: "#333",
  },
  actionButton: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: width * 0.04,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    width: "100%",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
