import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface Props {
  flashcardsData: {
    vocab: string;
    answer: string;
  }[];
}

export const FlashcardsScreen: React.FC<Props> = ({ flashcardsData }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcardsData.length);
    setShowAnswer(false);
  };

  const handlePrevCard = () => {
    setCurrentCardIndex(
      (prevIndex) =>
        (prevIndex - 1 + flashcardsData.length) % flashcardsData.length
    );
    setShowAnswer(false);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  if (flashcardsData.length === 0 || flashcardsData[0].vocab == "") {
    return (
      <View style={styles.emptyContainer}>
        <Text>No flashcards available.</Text>
      </View>
    );
  }

  const currentCard = flashcardsData[currentCardIndex];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.card} onPress={toggleAnswer}>
        <Text style={styles.cardText}>
          {showAnswer ? currentCard.answer : currentCard.vocab}
        </Text>
      </TouchableOpacity>
      <Text style={styles.instructionText}>Tap the card to flip</Text>
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navButton} onPress={handlePrevCard}>
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.cardCount}>{`${currentCardIndex + 1}/${
          flashcardsData.length
        }`}</Text>
        <TouchableOpacity style={styles.navButton} onPress={handleNextCard}>
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    height: 200,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 18,
    textAlign: "center",
  },
  instructionText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
  },
  navButtonText: {
    color: "white",
    fontSize: 16,
  },
  cardCount: {
    fontSize: 16,
  },
});
