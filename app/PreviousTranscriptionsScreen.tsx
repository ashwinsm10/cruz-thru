import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
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
  duration: string;
}

interface RouteParams {
  recordings: Recording[];
}

interface PreviousTranscriptionsScreenProps {
  route: { params: RouteParams };
}

const PreviousTranscriptionsScreen: React.FC<
  PreviousTranscriptionsScreenProps
> = ({ route }) => {
  const { recordings: initialRecordings } = route.params;
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
  const [sounds, setSounds] = useState<Array<Audio.Sound | null>>(
    Array(initialRecordings.length).fill(null)
  );
  const [isPlaying, setIsPlaying] = useState<boolean[]>(
    Array(initialRecordings.length).fill(false)
  );
  const [playbackPositions, setPlaybackPositions] = useState<number[]>(
    Array(initialRecordings.length).fill(0)
  );
  const [playbackDurations, setPlaybackDurations] = useState<number[]>(
    Array(initialRecordings.length).fill(0)
  );
  const [hasEnded, setHasEnded] = useState<boolean[]>(
    Array(initialRecordings.length).fill(false)
  );

  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    const loadPlaybackData = async () => {
      const savedData = await AsyncStorage.getItem("playbackData");
      if (savedData) {
        const { positions, playingStatuses } = JSON.parse(savedData);
        setPlaybackPositions(positions || []);
        setIsPlaying(playingStatuses || []);
      }
    };
    loadPlaybackData();
  }, []);

  useEffect(() => {
    const savePlaybackData = async () => {
      await AsyncStorage.setItem(
        "playbackData",
        JSON.stringify({
          positions: playbackPositions,
          playingStatuses: isPlaying,
        })
      );
    };
    savePlaybackData();
  }, [playbackPositions, isPlaying]);

  useEffect(() => {
    return () => {
      sounds.forEach((sound) => {
        sound?.unloadAsync();
      });
    };
  }, [sounds]);

  const playRecording = async (file: string, index: number) => {
    if (sounds[index]) {
      await sounds[index]?.unloadAsync();
    }

    const { sound, status } = await Audio.Sound.createAsync(
      { uri: file },
      { shouldPlay: true },
      updatePlaybackStatus(index)
    );

    const updatedSounds = [...sounds];
    updatedSounds[index] = sound;
    setSounds(updatedSounds);

    const updatedDurations = [...playbackDurations];
    updatedDurations[index] = status?.durationMillis ?? 0;
    setPlaybackDurations(updatedDurations);

    setHasEnded((prev) => {
      const updated = [...prev];
      updated[index] = false;
      return updated;
    });

    setIsPlaying((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  };

  const updatePlaybackStatus =
    (index: number) => (status: Audio.SoundStatus) => {
      if (status.isLoaded) {
        const newPositions = [...playbackPositions];
        newPositions[index] = status.positionMillis || 0;
        setPlaybackPositions(newPositions);

        if (status.didJustFinish) {
          setIsPlaying((prev) => {
            const updated = [...prev];
            updated[index] = false;
            return updated;
          });

          setHasEnded((prev) => {
            const updated = [...prev];
            updated[index] = true;
            return updated;
          });
        }
      }
    };

  const togglePlayPause = async (index: number) => {
    if (sounds[index]) {
      if (isPlaying[index]) {
        await sounds[index]?.pauseAsync();
      } else {
        await sounds[index]?.playAsync();
      }

      setIsPlaying((prev) => {
        const updated = [...prev];
        updated[index] = !updated[index];
        return updated;
      });
    } else {
      playRecording(recordings[index].file, index);
    }
  };

  const restartRecording = async (index: number) => {
    if (sounds[index]) {
      await sounds[index]?.setPositionAsync(0);
      await sounds[index]?.playAsync();
      setIsPlaying((prev) => {
        const updated = [...prev];
        updated[index] = true;
        return updated;
      });

      setHasEnded((prev) => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
    }
  };

  const handleSeek = async (value: number, index: number) => {
    if (sounds[index]) {
      await sounds[index]?.setPositionAsync(value);
      const updatedPositions = [...playbackPositions];
      updatedPositions[index] = value;
      setPlaybackPositions(updatedPositions);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDeleteRecording = async (index: number) => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedRecordings = [...recordings];
            updatedRecordings.splice(index, 1);
            setRecordings(updatedRecordings);

            await AsyncStorage.setItem(
              "recordings",
              JSON.stringify(updatedRecordings)
            );

            if (sounds[index]) {
              await sounds[index]?.unloadAsync();
              const updatedSounds = [...sounds];
              updatedSounds.splice(index, 1);
              setSounds(updatedSounds);
            }

            setIsPlaying((prev) => prev.filter((_, i) => i !== index));
            setPlaybackPositions((prev) => prev.filter((_, i) => i !== index));
            setPlaybackDurations((prev) => prev.filter((_, i) => i !== index));
            setHasEnded((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
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

  const renderRecordingItem = ({
    item,
    index,
  }: {
    item: Recording;
    index: number;
  }) => (
    <View style={styles.recordingContainer}>
      <Text style={styles.recordingTitle}>
        Recording {index + 1} - {item.duration}
      </Text>
      <View style={styles.controlsAndSummaryContainer}>
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={() => togglePlayPause(index)}
            style={styles.iconButton}
          >
            {isPlaying[index] ? (
              <PauseCircle size={32} color="#007AFF" />
            ) : (
              <PlayCircle size={32} color="#007AFF" />
            )}
          </TouchableOpacity>
          {hasEnded[index] && (
            <TouchableOpacity
              onPress={() => restartRecording(index)}
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
          value={playbackPositions[index]}
          minimumValue={0}
          maximumValue={playbackDurations[index]}
          onValueChange={(value) => handleSeek(value, index)}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#CCCCCC"
          thumbTintColor="#007AFF"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {formatTime(playbackPositions[index])}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(playbackDurations[index])}
          </Text>
        </View>
      </View>
    </View>
  );
  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        renderItem={renderRecordingItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
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
