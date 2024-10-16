import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import {
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Share2,
  Trash2,
  FileText,
} from "lucide-react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";

const { width } = Dimensions.get("window");

interface Recording {
  file: string;
  duration: number;
}

interface RouteParams {
  recordings: Recording[];
}

interface PreviousTranscriptionsScreenProps {
  route: { params: RouteParams };
}

const useAsyncStorage = (key: string) => {
  const getValue = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return null;
    }
  }, [key]);

  const setValue = useCallback(
    async (data: any) => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error(`Error saving ${key}:`, error);
      }
    },
    [key]
  );

  return { getValue, setValue };
};

const PreviousTranscriptionsScreen: React.FC<PreviousTranscriptionsScreenProps> = ({ route }) => {
  const { recordings: initialRecordings } = route.params;
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
  const [playbackStatus, setPlaybackStatus] = useState(
    initialRecordings.map(() => ({
      isPlaying: false,
      position: 0,
      duration: 0,
      hasEnded: false,
    }))
  );

  const sounds = useRef<(Audio.Sound | null)[]>(Array(initialRecordings.length).fill(null));
  const navigation = useNavigation<NavigationProp<any>>();
  const { getValue: getRecordings, setValue: saveRecordings } = useAsyncStorage("recordings");
  const { getValue: getPlaybackData, setValue: savePlaybackData } = useAsyncStorage("playbackData");

  useEffect(() => {
    const loadRecordingsAndDurations = async () => {
      const savedRecordings = await getRecordings();
      if (savedRecordings) {
        const durations = await Promise.all(
          savedRecordings.map(async (rec: Recording) => {
            if (rec.duration > 0) return rec.duration;
            const { sound, status } = await Audio.Sound.createAsync({ uri: rec.file });
            await sound.unloadAsync();
            return status.durationMillis || 0;
          })
        );
        setRecordings((prev) =>
          prev.map((rec, i) => ({
            ...rec,
            duration: durations[i],
          }))
        );
      }
    };
    loadRecordingsAndDurations();
  }, [getRecordings]);

  useEffect(() => {
    const loadPlaybackData = async () => {
      const savedData = await getPlaybackData();
      if (savedData) {
        setPlaybackStatus((prev) =>
          prev.map((status, i) => ({
            ...status,
            position: savedData.positions[i] || 0,
            isPlaying: savedData.playingStatuses[i] || false,
          }))
        );
      }
    };
    loadPlaybackData();
  }, [getPlaybackData]);

  useEffect(() => {
    return () => {
      sounds.current.forEach((sound) => {
        sound?.unloadAsync();
      });
    };
  }, []);

  const updatePlaybackStatus = (index: number, status: Audio.SoundStatus) => {
    if (status.isLoaded) {
      setPlaybackStatus((prev) =>
        prev.map((playback, i) =>
          i === index
            ? {
                ...playback,
                position: status.positionMillis || 0,
                isPlaying: status.isPlaying,
                hasEnded: status.didJustFinish,
              }
            : playback
        )
      );
    }
  };

  const playRecording = async (file: string, index: number) => {
    if (sounds.current[index]) {
      await sounds.current[index]?.unloadAsync();
    }
    const { sound, status } = await Audio.Sound.createAsync(
      { uri: file },
      { shouldPlay: true },
      (status) => updatePlaybackStatus(index, status)
    );
    sounds.current[index] = sound;

    if (status.isLoaded && status.durationMillis) {
      setRecordings((prev) =>
        prev.map((rec, i) => (i === index ? { ...rec, duration: status.durationMillis! } : rec))
      );
    }
  };

  const togglePlayPause = async (index: number) => {
    if (sounds.current[index]) {
      const isPlaying = playbackStatus[index].isPlaying;
      await (isPlaying ? sounds.current[index]?.pauseAsync() : sounds.current[index]?.playAsync());
      setPlaybackStatus((prev) =>
        prev.map((playback, i) => (i === index ? { ...playback, isPlaying: !isPlaying } : playback))
      );
    } else {
      playRecording(recordings[index].file, index);
    }
  };

  const goToStudyMaterials = useCallback(
    (index: number) => {
      const recording = recordings[index];
      if (recording) {
        navigation.navigate("Study Materials", { audioFile: recording.file });
      }
    },
    [recordings, navigation]
  );

  const handleDeleteRecording = async (index: number) => {
    Alert.alert("Delete Recording", "Are you sure you want to delete this recording?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setRecordings((prev) => prev.filter((_, i) => i !== index));
          sounds.current[index]?.unloadAsync();
          sounds.current = sounds.current.filter((_, i) => i !== index);
          setPlaybackStatus((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const renderRecordingItem = useCallback(
    ({ item, index }) => {
      const status = playbackStatus[index];
      return (
        <View style={styles.recordingContainer}>
          <Text style={styles.recordingTitle}>
            Recording {index + 1} - {formatTime(item.duration)}
          </Text>
          <View style={styles.controlsAndSummaryContainer}>
            <View style={styles.controlsContainer}>
              <TouchableOpacity onPress={() => togglePlayPause(index)} style={styles.iconButton}>
                {status.isPlaying ? (
                  <PauseCircle size={32} color="#007AFF" />
                ) : (
                  <PlayCircle size={32} color="#007AFF" />
                )}
              </TouchableOpacity>
              {status.hasEnded && (
                <TouchableOpacity
                  onPress={() => playRecording(recordings[index].file, index)}
                  style={styles.iconButton}
                >
                  <RotateCcw size={32} color="#007AFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => Sharing.shareAsync(item.file)}
                style={styles.iconButton}
              >
                <Share2 size={32} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteRecording(index)}
                style={styles.iconButton}
              >
                <Trash2 size={32} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => goToStudyMaterials(index)}
              style={styles.viewSummaryButton}
            >
              <FileText size={24} color="#FFFFFF" />
              <Text style={styles.viewSummaryText}>View Summary</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressContainer}>
            <Slider
              style={styles.slider}
              value={status.position}
              minimumValue={0}
              maximumValue={item.duration}
              onValueChange={(value) => {
                sounds.current[index]?.setPositionAsync(value);
                setPlaybackStatus((prev) =>
                  prev.map((playback, i) => (i === index ? { ...playback, position: value } : playback))
                );
              }}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#CCCCCC"
              thumbTintColor="#007AFF"
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(status.position)}</Text>
              <Text style={styles.timeText}>{formatTime(item.duration)}</Text>
            </View>
          </View>
        </View>
      );
    },
    [playbackStatus, recordings]
  );

  return (
    <View style={styles.container}>
      <FlatList data={recordings} renderItem={renderRecordingItem} keyExtractor={(item, index) => index.toString()} />
    </View>
  );
};

const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0.05 * width,
    backgroundColor: "#F5F5F5",
  },
  recordingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 0.04 * width,
    marginBottom: 0.05 * width,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingTitle: {
    fontSize: 0.045 * width,
    fontWeight: "bold",
    marginBottom: 10,
  },
  controlsAndSummaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  controlsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  iconButton: {
    marginRight: 15,
  },
  viewSummaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewSummaryText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 0.035 * width,
  },
  progressContainer: {
    flexDirection: "column",
  },
  slider: {
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 0.03 * width,
    color: "#777",
  },
});

export default PreviousTranscriptionsScreen;