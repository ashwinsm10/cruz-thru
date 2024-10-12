import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
} from "lucide-react-native";

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
  const { recordings } = route.params;

  const [sounds, setSounds] = useState<Array<Audio.Sound | null>>(
    Array(recordings.length).fill(null)
  );
  const [isPlaying, setIsPlaying] = useState<boolean[]>(
    Array(recordings.length).fill(false)
  );
  const [playbackPositions, setPlaybackPositions] = useState<number[]>(
    Array(recordings.length).fill(0)
  );
  const [playbackDurations, setPlaybackDurations] = useState<number[]>(
    Array(recordings.length).fill(0)
  );
  const [hasEnded, setHasEnded] = useState<boolean[]>(
    Array(recordings.length).fill(false)
  );

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

  const getRecordingLines = () => {
    return recordings.map((recordingLine, index) => (
      <View key={index} style={styles.recordingContainer}>
        <Text style={styles.recordingTitle}>
          Recording {index + 1} - {recordingLine.duration}
        </Text>
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
            onPress={() => Sharing.shareAsync(recordingLine.file)}
            style={styles.iconButton}
          >
            <Share2 size={32} color="#007AFF" />
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
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView>{getRecordingLines()}</ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  recordingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 10,
  },
  iconButton: {
    marginRight: 20,
  },
  progressContainer: {
    width: "100%",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
  },
});

export default PreviousTranscriptionsScreen;
