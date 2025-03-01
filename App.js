import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

// Sample flashcard data
const sampleDeck = [
  { id: "1", front: "Hello", back: "Hola", language: "Spanish" },
  { id: "2", front: "Goodbye", back: "Adiós", language: "Spanish" },
  { id: "3", front: "Thank you", back: "Gracias", language: "Spanish" },
  { id: "4", front: "Please", back: "Por favor", language: "Spanish" },
];

export default function App() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [deck, setDeck] = useState(sampleDeck);

  const currentCard = deck[currentCardIndex];

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prevIndex) =>
      prevIndex === deck.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prevIndex) =>
      prevIndex === 0 ? deck.length - 1 : prevIndex - 1
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Language Flashcards</Text>
        <Text style={styles.subHeaderText}>{currentCard.language}</Text>
      </View>

      <TouchableOpacity style={styles.card} onPress={flipCard}>
        <Text style={styles.cardText}>
          {isFlipped ? currentCard.back : currentCard.front}
        </Text>
        <Text style={styles.flipHint}>Tap to flip</Text>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={prevCard}>
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={nextCard}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.counter}>
        Card {currentCardIndex + 1} of {deck.length}
      </Text>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subHeaderText: {
    fontSize: 18,
    color: "#666",
    marginTop: 5,
  },
  card: {
    width: "100%",
    height: 200,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 28,
    fontWeight: "500",
    textAlign: "center",
  },
  flipHint: {
    position: "absolute",
    bottom: 10,
    fontSize: 12,
    color: "#999",
  },
  controls: {
    flexDirection: "row",
    marginTop: 30,
    width: "100%",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#4a86e8",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  counter: {
    marginTop: 20,
    fontSize: 14,
    color: "#666",
  },
});
