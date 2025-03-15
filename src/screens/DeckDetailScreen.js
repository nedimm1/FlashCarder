import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { DataContext } from "../context/DataContext";

export const DeckDetailScreen = ({ route, navigation }) => {
  const { deckIndex } = route.params;
  const { decks, updateDecks } = useContext(DataContext);
  const deck = decks[deckIndex];
  const [studyMode, setStudyMode] = useState(false);
  const [cardStatuses, setCardStatuses] = useState({});
  const [cardsToReview, setCardsToReview] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const deleteDeck = () => {
    Alert.alert("Delete Deck", "Are you sure you want to delete this deck?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedDecks = decks.filter((_, index) => index !== deckIndex);
          updateDecks(updatedDecks);
          navigation.goBack();
        },
      },
    ]);
  };

  const startStudyMode = () => {
    if (deck.cards.length === 0) {
      Alert.alert("No Cards", "Add some cards to the deck first!");
      return;
    }
    setStudyMode(true);
    setCardsToReview([...deck.cards]);
    setCardStatuses({});
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const exitStudyMode = () => {
    setStudyMode(false);
    setCardsToReview([]);
    setCardStatuses({});
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const handleGotIt = () => {
    const newStatuses = { ...cardStatuses };
    newStatuses[currentCardIndex] = true;
    setCardStatuses(newStatuses);
    goToNextCard();
  };

  const handleDidntGetIt = () => {
    const newStatuses = { ...cardStatuses };
    newStatuses[currentCardIndex] = false;
    setCardStatuses(newStatuses);
    const currentCard = cardsToReview[currentCardIndex];
    const remainingCards = cardsToReview.filter(
      (_, index) => index !== currentCardIndex
    );
    setCardsToReview([...remainingCards, currentCard]);
    goToNextCard();
  };

  const goToNextCard = () => {
    setShowAnswer(false);
    if (currentCardIndex < cardsToReview.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentCardIndex(0);
    }
  };

  const getScoreText = () => {
    const correct = Object.values(cardStatuses).filter(
      (status) => status === true
    ).length;
    const incorrect = Object.values(cardStatuses).filter(
      (status) => status === false
    ).length;
    return `${correct}✅ ${incorrect}❌`;
  };

  if (studyMode) {
    const currentCard = cardsToReview[currentCardIndex];
    return (
      <View style={styles.container}>
        <Text style={styles.scoreText}>{getScoreText()}</Text>
        <View style={styles.cardContainer}>
          <Text style={styles.questionText}>
            {showAnswer ? "Answer:" : "Question:"}
          </Text>
          <Text style={styles.cardText}>
            {showAnswer ? currentCard.back : currentCard.front}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {!showAnswer ? (
            <TouchableOpacity
              style={styles.showAnswerButton}
              onPress={() => setShowAnswer(true)}
            >
              <Text style={styles.buttonText}>Show Answer</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.answerButton, styles.gotItButton]}
                onPress={handleGotIt}
              >
                <Text style={styles.buttonText}>Got It</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.answerButton, styles.didntGetItButton]}
                onPress={handleDidntGetIt}
              >
                <Text style={styles.buttonText}>Didn't Get It</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.exitButton} onPress={exitStudyMode}>
            <Text style={styles.buttonText}>Exit Study Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{deck.name}</Text>
      <Text style={styles.cardCount}>{deck.cards.length} cards</Text>

      <ScrollView style={styles.cardList}>
        {deck.cards.map((card, index) => (
          <View key={index} style={styles.cardPreview}>
            <Text style={styles.cardPreviewText}>Q: {card.front}</Text>
            <Text style={styles.cardPreviewText}>A: {card.back}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("AddCard", { deckIndex })}
        >
          <Text style={styles.buttonText}>Add Card</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.studyButton]}
          onPress={startStudyMode}
        >
          <Text style={styles.buttonText}>Start Studying</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={deleteDeck}
        >
          <Text style={styles.buttonText}>Delete Deck</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  cardCount: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  cardList: {
    flex: 1,
  },
  cardPreview: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardPreviewText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  studyButton: {
    backgroundColor: "#34C759",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 24,
    color: "#333",
    textAlign: "center",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  showAnswerButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  answerButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  gotItButton: {
    backgroundColor: "#34C759",
  },
  didntGetItButton: {
    backgroundColor: "#FF3B30",
  },
  exitButton: {
    backgroundColor: "#8E8E93",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
});
