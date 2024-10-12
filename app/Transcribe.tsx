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
} from "react-native";
import Slider from "@react-native-community/slider";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Audio, Recording } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";

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

  const animationValue = useRef(new Animated.Value(0)).current;
  const playbackInterval = useRef<NodeJS.Timeout | null>(null);

  const navigation = useNavigation();

  useEffect(() => {
    return () => {
      if (recording) stopRecording();
      if (sound) sound.unloadAsync();
      if (playbackInterval.current) clearInterval(playbackInterval.current);
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
      await newRecording.startAsync();
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);

    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.unloadAsync(); 
          }
        } catch (error) {
          console.error("Error unloading sound:", error);
        }
        setSound(null);
      }

      const { sound: newSound, status } =
        await recording.createNewLoadedSoundAsync();
      if (uri && status.durationMillis) {
        const newRecordingData = {
          duration: formatDuration(status.durationMillis),
          file: uri,
        };
        setRecordings((prev) => [...prev, newRecordingData]);
        setSound(newSound); 
        setDuration(status.durationMillis / 1000);
      }
    }

    setRecording(null);
    animateButtons();
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
    if (result.assets) {
      const duration = await getFileDuration(result.uri);
      setRecordings((prev) => [
        ...prev,
        { duration: formatDuration(duration), file: result.uri },
      ]);
      animateButtons();
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
        }
      }
    }
  }, [sound]);
  const playPauseAudio = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        clearInterval(playbackInterval.current!);
      } else {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          await sound.loadAsync({
            uri: recordings[recordings.length - 1].file,
          });
        }
        await sound.playAsync(); 
        playbackInterval.current = setInterval(updatePlaybackStatus, 1000);
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
    }
  };

  const shareAudio = async () => {
    const lastRecording = recordings[recordings.length - 1];
    if (lastRecording?.file) {
      await Share.share({ url: lastRecording.file });
    }
  };

  const onSliderValueChange = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value * 1000);
      setPosition(value);
    }
  };

  const viewSummary = useCallback(() => {
    const lastRecording = recordings[recordings.length - 1];
    if (lastRecording) {
      navigation.navigate("Summary", { audioUrl: lastRecording.file });
    }
  }, [recordings, navigation]);

  const viewTranscription = useCallback(() => {
    const lastRecording = recordings[recordings.length - 1];
    if (lastRecording) {
      navigation.navigate("Transcription", { recording: lastRecording });
    }
  }, [recordings, navigation]);

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
            >
              <Icon
                name={isRecording ? "stop" : "microphone"}
                size={60}
                color="#000"
              />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.recordingStatus}>
            {isRecording ? "Recording..." : "Tap to start recording"}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleImport}>
              <Icon name="file-upload-outline" size={30} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {recordings.length > 0 && (
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
              >
                <Icon name="restart" size={30} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.audioControlButton}
                onPress={shareAudio}
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
              />
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {formatDuration(position * 1000)}
                </Text>
                <Text style={styles.timeText}>
                  {formatDuration(duration * 1000)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={viewSummary}>
              <Text style={styles.actionButtonText}>View Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={viewTranscription}
            >
              <Text style={styles.actionButtonText}>View Transcription</Text>
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
  recordingStatus: {
    fontSize: 18,
    color: "#333",
    marginBottom: height * 0.03,
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
