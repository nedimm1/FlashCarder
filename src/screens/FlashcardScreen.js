import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import { useFocusEffect } from "@react-navigation/native";
import { styles } from "../styles/styles";
import { DataContext } from "../context/DataContext";

const windowWidth = Dimensions.get("window").width;

function FlashcardScreen({ route, navigation }) {
  const { deckId } = route.params;
  const {
    decks,
    updateDecks,
    studySessions,
    updateStudySession,
    clearStudySession,
  } = React.useContext(DataContext);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [cardsToReview, setCardsToReview] = useState([]);
  const [cardStatuses, setCardStatuses] = useState({});
  const [isSecondRound, setIsSecondRound] = useState(false);
  const [cardsReviewed, setCardsReviewed] = useState(0);

  // Single effect to manage study session state
  useFocusEffect(
    React.useCallback(() => {
      const savedSession = studySessions[deckId];
      if (savedSession && savedSession.cardsToReview?.length > 0) {
        // Only restore session if we're not already in the same state
        if (!studyMode || currentCardIndex !== savedSession.currentCardIndex) {
          setStudyMode(true);
          setCardsToReview(savedSession.cardsToReview);
          setCardStatuses(savedSession.cardStatuses || {});
          setIsSecondRound(savedSession.isSecondRound || false);
          setCardsReviewed(savedSession.cardsReviewed || 0);
          setCurrentCardIndex(savedSession.currentCardIndex || 0);
        }
      }

      // Cleanup: save session if in study mode and there are changes to save
      return () => {
        if (studyMode && cardsToReview.length > 0) {
          const currentSession = studySessions[deckId];
          const hasChanges =
            !currentSession ||
            currentSession.currentCardIndex !== currentCardIndex ||
            currentSession.cardsReviewed !== cardsReviewed ||
            JSON.stringify(currentSession.cardsToReview) !==
              JSON.stringify(cardsToReview);

          if (hasChanges) {
            updateStudySession(deckId, {
              cardsToReview,
              cardStatuses,
              isSecondRound,
              cardsReviewed,
              currentCardIndex,
            });
          }
        }
      };
    }, [
      deckId,
      studyMode,
      cardsToReview,
      cardStatuses,
      isSecondRound,
      cardsReviewed,
      currentCardIndex,
      studySessions,
      updateStudySession,
    ])
  );

  // Animation values
  const position = new Animated.ValueXY();
  const swipeThreshold = 80;
  const rotateCard = position.x.interpolate({
    inputRange: [-windowWidth / 2, 0, windowWidth / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  // Find the current deck
  const deck = decks.find((d) => d.id === deckId);
  const cards = deck ? deck.cards : [];

  // Calculate correct and incorrect counts
  const correctCount = Object.values(cardStatuses).filter(
    (status) => status === "correct"
  ).length;
  const incorrectCount = Object.values(cardStatuses).filter(
    (status) => status === "incorrect"
  ).length;

  // Add this effect to update cards when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Find the current deck again to get fresh data
      const updatedDeck = decks.find((d) => d.id === deckId);
      if (updatedDeck) {
        // If in study mode, update the cards to review while maintaining order
        if (studyMode && cardsToReview.length > 0) {
          const updatedCardsToReview = cardsToReview.map((card) => {
            // Find the updated version of this card
            const updatedCard = updatedDeck.cards.find((c) => c.id === card.id);
            return updatedCard || card; // Use updated card if found, otherwise keep original
          });
          setCardsToReview(updatedCardsToReview);
        }
      }
    }, [decks, deckId, studyMode])
  );

  // Handle empty deck case
  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity
            style={styles.backArrow}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>{deck.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.emptyDeckText}>This deck has no cards yet.</Text>

        <View style={styles.emptyDeckButtons}>
          <TouchableOpacity
            style={[styles.button, styles.studyButton]}
            onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
          >
            <Text style={styles.buttonText}>Add Cards</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Handle when all cards have been reviewed
  if (studyMode && cardsToReview.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity
            style={styles.backArrow}
            onPress={() => {
              setStudyMode(false);
              clearStudySession(deckId);
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>{deck.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.completionContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.completionText}>
            {isSecondRound ? "Study Complete!" : "First Round Complete!"}
          </Text>
          <Text style={styles.completionSubtext}>
            {isSecondRound
              ? "You've completed both rounds of study."
              : "Now let's practice with English on the front!"}
          </Text>

          {!isSecondRound ? (
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={() => {
                const reversedCards = cards.map((card) => ({
                  ...card,
                  front: card.back,
                  back: card.front,
                  isReversed: true,
                }));
                setCardsToReview(reversedCards);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setIsSecondRound(true);
                setCardStatuses({});
                setCardsReviewed(0);
              }}
            >
              <Text style={styles.buttonText}>Start English Front Round</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={() => {
                clearStudySession(deckId);
                setStudyMode(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.buttonText}>Exit Study Mode</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = studyMode
    ? cardsToReview[currentCardIndex]
    : cards[currentCardIndex];

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGotIt = () => {
    // Update card status
    setCardStatuses((prevStatuses) => {
      const newStatuses = { ...prevStatuses };
      newStatuses[currentCard.id] = "correct";
      return newStatuses;
    });

    // Increment cards reviewed counter
    setCardsReviewed((prev) => prev + 1);

    if (studyMode) {
      const updatedCardsToReview = cardsToReview.filter(
        (c) => c.id !== currentCard.id
      );
      setCardsToReview(updatedCardsToReview);

      if (currentCardIndex >= updatedCardsToReview.length) {
        setCurrentCardIndex(Math.max(0, updatedCardsToReview.length - 1));
      }
      setIsFlipped(false);
    } else {
      nextCard();
    }
  };

  const handleDidntGetIt = () => {
    // Update card status
    setCardStatuses((prevStatuses) => {
      const newStatuses = { ...prevStatuses };
      newStatuses[currentCard.id] = "incorrect";
      return newStatuses;
    });

    if (studyMode) {
      // Move current card to the end of the review list
      const updatedCardsToReview = [...cardsToReview];
      const currentCardToMove = updatedCardsToReview.splice(
        currentCardIndex,
        1
      )[0];
      updatedCardsToReview.push(currentCardToMove);
      setCardsToReview(updatedCardsToReview);

      setIsFlipped(false);
      if (currentCardIndex >= updatedCardsToReview.length) {
        setCurrentCardIndex(0);
      }
    } else {
      nextCard();
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    position.setValue({ x: 0, y: 0 });
    setCurrentCardIndex((prevIndex) =>
      prevIndex === (studyMode ? cardsToReview.length : cards.length) - 1
        ? 0
        : prevIndex + 1
    );
  };

  const prevCard = () => {
    setIsFlipped(false);
    position.setValue({ x: 0, y: 0 });
    setCurrentCardIndex((prevIndex) =>
      prevIndex === 0
        ? (studyMode ? cardsToReview.length : cards.length) - 1
        : prevIndex - 1
    );
  };

  // Delete the current card
  const deleteCurrentCard = () => {
    Alert.alert("Delete Card", "Are you sure you want to delete this card?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // Create a copy of the current deck
          const updatedDeck = { ...deck };

          // Remove the current card from the deck's cards
          updatedDeck.cards = deck.cards.filter(
            (_, index) => index !== currentCardIndex
          );

          // Update the decks array with the modified deck
          const updatedDecks = decks.map((d) =>
            d.id === deckId ? updatedDeck : d
          );

          // If in study mode, also remove the card from cardsToReview
          if (studyMode) {
            const updatedCardsToReview = cardsToReview.filter(
              (_, index) => index !== currentCardIndex
            );
            setCardsToReview(updatedCardsToReview);
          }

          // Update the state and save to storage
          updateDecks(updatedDecks);

          // If we deleted the last card, go to the previous card
          if (
            currentCardIndex >=
            (studyMode ? cardsToReview.length : updatedDeck.cards.length)
          ) {
            setCurrentCardIndex(
              Math.max(
                0,
                (studyMode ? cardsToReview.length : updatedDeck.cards.length) -
                  1
              )
            );
          }

          // If we deleted the last card in the deck, go back to the home screen
          if (updatedDeck.cards.length === 0) {
            navigation.goBack();
          }
        },
      },
    ]);
  };

  // Reset study stats when starting study mode
  const startStudyMode = () => {
    // Check if there's an existing session first
    const savedSession = studySessions[deckId];

    const newSession = {
      cardsToReview: savedSession?.cardsToReview || [...cards],
      cardStatuses: savedSession?.cardStatuses || {},
      isSecondRound: savedSession?.isSecondRound || false,
      cardsReviewed: savedSession?.cardsReviewed || 0,
      currentCardIndex: savedSession?.currentCardIndex || 0,
    };

    // Save the session first
    updateStudySession(deckId, newSession);

    // Then update local state
    setStudyMode(true);
    setCardsToReview(newSession.cardsToReview);
    setCurrentCardIndex(newSession.currentCardIndex);
    setIsFlipped(false);
    setIsSecondRound(newSession.isSecondRound);
    setCardStatuses(newSession.cardStatuses);
    setCardsReviewed(newSession.cardsReviewed);
  };

  const handleInStudyExit = () => {
    // First clear the session from storage
    clearStudySession(deckId);

    // Then reset all state
    setStudyMode(false);
    setCardsToReview([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsSecondRound(false);
    setCardStatuses({});
    setCardsReviewed(0);
  };

  const handleExitStudyMode = () => {
    // First clear the session
    clearStudySession(deckId);

    // Then reset all state
    setStudyMode(false);
    setCardsToReview([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsSecondRound(false);
    setCardStatuses({});
    setCardsReviewed(0);

    // Finally navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={flashcardStyles.container}>
      <View style={flashcardStyles.header}>
        <TouchableOpacity
          style={flashcardStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={flashcardStyles.headerTextContainer}>
          <Text style={flashcardStyles.headerTitle}>{deck.title}</Text>
          <Text style={flashcardStyles.headerSubtitle}>{deck.displayName}</Text>
          {studyMode && (
            <Text style={flashcardStyles.studyStats}>
              {correctCount}✅ {incorrectCount}❌ • {cardsToReview.length} cards
              left
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={flashcardStyles.addButton}
          onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={flashcardStyles.cardContainer}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PanGestureHandler
            onGestureEvent={Animated.event(
              [{ nativeEvent: { translationX: position.x } }],
              { useNativeDriver: false }
            )}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.oldState === State.ACTIVE) {
                const { translationX } = nativeEvent;
                if (Math.abs(translationX) > swipeThreshold) {
                  const toValue = translationX > 0 ? windowWidth : -windowWidth;
                  Animated.timing(position, {
                    toValue: { x: toValue, y: 0 },
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => {
                    position.setValue({ x: 0, y: 0 });
                    if (studyMode) {
                      if (translationX > 0) {
                        handleGotIt();
                      } else {
                        handleDidntGetIt();
                      }
                    } else {
                      // Regular navigation mode
                      if (translationX > 0) {
                        // Swipe right - go to next card
                        nextCard();
                      } else {
                        // Swipe left - go to previous card
                        prevCard();
                      }
                    }
                  });
                } else {
                  Animated.spring(position, {
                    toValue: { x: 0, y: 0 },
                    friction: 5,
                    useNativeDriver: false,
                  }).start();
                }
              }
            }}
          >
            <Animated.View
              style={[
                flashcardStyles.card,
                {
                  transform: [
                    { translateX: position.x },
                    { rotate: rotateCard },
                  ],
                },
              ]}
            >
              <View style={flashcardStyles.cardActions}>
                <TouchableOpacity
                  style={flashcardStyles.editButton}
                  onPress={() => {
                    // If in study mode, find the actual index of the card in the original deck
                    const currentCard = studyMode
                      ? cardsToReview[currentCardIndex]
                      : cards[currentCardIndex];
                    const actualCardIndex = cards.findIndex(
                      (card) => card.id === currentCard.id
                    );
                    navigation.navigate("EditCard", {
                      deckId: deck.id,
                      cardIndex: actualCardIndex,
                    });
                  }}
                >
                  <Ionicons name="pencil" size={24} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={flashcardStyles.deleteButton}
                  onPress={deleteCurrentCard}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={flashcardStyles.cardContent}
                onPress={() => setIsFlipped(!isFlipped)}
                activeOpacity={0.9}
              >
                <Text style={flashcardStyles.cardText}>
                  {isFlipped ? currentCard.back : currentCard.front}
                </Text>
                {!isFlipped && currentCard.pronunciation && (
                  <Text style={flashcardStyles.pronunciationText}>
                    [{currentCard.pronunciation}]
                  </Text>
                )}
                {isFlipped && currentCard.example && (
                  <Text style={flashcardStyles.exampleText}>
                    Example: {currentCard.example}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={flashcardStyles.flipHint}>Tap to flip</Text>

              {studyMode && (
                <View style={flashcardStyles.navigationButtons}>
                  <TouchableOpacity
                    style={[
                      flashcardStyles.navButton,
                      flashcardStyles.prevButton,
                    ]}
                    onPress={handleDidntGetIt}
                  >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      flashcardStyles.navButton,
                      flashcardStyles.nextButton,
                    ]}
                    onPress={handleGotIt}
                  >
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </PanGestureHandler>
        </GestureHandlerRootView>
      </View>

      <Text style={flashcardStyles.counter}>
        Card {studyMode ? cardsReviewed + 1 : currentCardIndex + 1} of{" "}
        {studyMode ? cardsToReview.length + cardsReviewed : cards.length}
      </Text>

      {studyMode ? (
        <TouchableOpacity
          style={flashcardStyles.exitButton}
          onPress={handleInStudyExit}
        >
          <Text style={flashcardStyles.buttonText}>Exit Study Mode</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={flashcardStyles.studyButton}
          onPress={startStudyMode}
        >
          <Text style={flashcardStyles.buttonText}>Start Studying</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const flashcardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  addButton: {
    padding: 10,
    marginRight: -10,
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: windowWidth - 40,
    aspectRatio: 0.7,
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardActions: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 1,
  },
  editButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
  },
  cardText: {
    fontSize: 36,
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 20,
  },
  exampleText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
  flipHint: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  counter: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "500",
  },
  navigationButtons: {
    position: "absolute",
    bottom: "50%",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  prevButton: {
    backgroundColor: "#FF3B30",
  },
  nextButton: {
    backgroundColor: "#4CAF50",
  },
  studyButton: {
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
  },
  exitButton: {
    backgroundColor: "#2196F3",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  studyStats: {
    color: "#999",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
  pronunciationText: {
    fontSize: 20,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
});

export default FlashcardScreen;
