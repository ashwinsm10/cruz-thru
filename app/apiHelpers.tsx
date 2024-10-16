import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://169.233.115.16:5001";

export const fetchData = async (audioFile, setData, setError, setLoading) => {
  try {
    const storedData = await AsyncStorage.getItem(audioFile);

    if (storedData) {
      setData(JSON.parse(storedData));
      setLoading(false);
      return;
    }

    const fileInfo = await FileSystem.getInfoAsync(audioFile);

    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    const formData = new FormData();
    formData.append("audio_file", {
      uri: audioFile,
      type: "audio/x-caf",
      name: "recording.caf",
    });

    const response = await fetch(`${API_URL}/transcribe`, {
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

    const newData = {
      transcription: responseData.transcription,
      summary: responseData.lecture_notes,
      flashcards: responseData.flashcards,
    };

    await AsyncStorage.setItem(audioFile, JSON.stringify(newData));

    setData(newData);
  } catch (err) {
    setError("Failed to fetch data");
  } finally {
    setLoading(false);
  }
};

export const askQuestion = async (summaryText, question) => {
  const response = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notes: summaryText,
      question: question,
    }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return await response.json();
};