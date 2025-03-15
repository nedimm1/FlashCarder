import React, { useState } from "react";
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
import { styles } from "../styles/styles";
import { DataContext } from "../context/DataContext";

function FlashcardScreen({ route, navigation }) {
  const { deckId } = route.params;
  const { decks, updateDecks } = React.useContext(DataContext);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [cardsToReview, setCardsToReview] = useState([]);
  const [cardStatuses, setCardStatuses] = useState({});

  // Animation values
  const position = new Animated.ValueXY();
  const swipeThreshold = 80;
  const screenWidth = Dimensions.get("window").width;
  const rotateCard = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  // Find the current deck
  const deck = decks.find((d) => d.id === deckId);
  const cards = deck ? deck.cards : [];

  // Calculate correct and incorrect counts from cardStatuses
  const correctCount = Object.values(cardStatuses).filter(
    (status) => status === "correct"
  ).length;
  const incorrectCount = Object.values(cardStatuses).filter(
    (status) => status === "incorrect"
  ).length;

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

        <View style={styles.completionContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.completionText}>Study Complete!</Text>
          <Text style={styles.completionSubtext}>
            You've gone through all the cards in this deck.
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={() => {
              // Reset study session with all cards
              setCardsToReview([...cards]);
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
          >
            <Text style={styles.buttonText}>Study Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => {
              setStudyMode(false);
              setCardsToReview([]);
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
          >
            <Text style={styles.buttonText}>Exit Study Mode</Text>
          </TouchableOpacity>
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
    setStudyMode(true);
    setCardsToReview([...cards]);
    setCurrentCardIndex(0);
    setIsFlipped(false);

    // Initialize card statuses with all null values
    setCardStatuses({});
  };

  // Handle gesture state change
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: position.x } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, velocityX } = event.nativeEvent;

      // Consider both distance and velocity for swipe detection
      // A fast swipe with less distance or a slow swipe with more distance can both trigger the action
      if (translationX > swipeThreshold || velocityX > 200) {
        // Swiped right - Got it right
        Animated.timing(position, {
          toValue: { x: screenWidth, y: 0 },
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          handleGotIt();
          position.setValue({ x: 0, y: 0 });
        });
      } else if (translationX < -swipeThreshold || velocityX < -200) {
        // Swiped left - Got it wrong
        Animated.timing(position, {
          toValue: { x: -screenWidth, y: 0 },
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          handleDidntGetIt();
          position.setValue({ x: 0, y: 0 });
        });
      } else {
        // Not swiped far enough, reset position
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            <Text style={styles.subHeaderText}>
              {studyMode ? "Study Mode" : deck.language}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {studyMode && (
          <View style={styles.studyStats}>
            <Text style={styles.studyCounter}>
              <Text style={styles.correctStat}>{correctCount}✅</Text>{" "}
              <Text style={styles.incorrectStat}>{incorrectCount}❌</Text>
              {" • "}
              {cardsToReview.length} cards left
            </Text>
          </View>
        )}

        <View style={styles.cardContainer}>
          {studyMode ? (
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
            >
              <Animated.View
                style={[
                  styles.swipeableCard,
                  {
                    transform: [
                      { translateX: position.x },
                      { rotate: rotateCard },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.fullCard}
                  activeOpacity={0.9}
                  onPress={flipCard}
                >
                  <Text style={styles.cardText}>
                    {isFlipped ? currentCard.back : currentCard.front}
                  </Text>
                  {isFlipped && currentCard.example && (
                    <Text style={styles.exampleText}>
                      Example: {currentCard.example}
                    </Text>
                  )}
                  <Text style={styles.flipHint}>Tap to flip</Text>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      navigation.navigate("EditCard", {
                        deckId: deck.id,
                        cardIndex: currentCardIndex,
                      })
                    }
                  >
                    <Ionicons name="pencil" size={24} color="#2196F3" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={deleteCurrentCard}
                  >
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  </TouchableOpacity>

                  {/* Arrows inside the card */}
                  <TouchableOpacity
                    style={[styles.arrowButton, styles.leftArrow]}
                    onPress={handleDidntGetIt}
                  >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.arrowButton, styles.rightArrow]}
                    onPress={handleGotIt}
                  >
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            </PanGestureHandler>
          ) : (
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={(event) => {
                if (event.nativeEvent.oldState === State.ACTIVE) {
                  const { translationX, velocityX } = event.nativeEvent;

                  // Consider both distance and velocity for swipe detection
                  if (translationX > swipeThreshold || velocityX > 200) {
                    // Swiped right - Next card
                    Animated.timing(position, {
                      toValue: { x: screenWidth, y: 0 },
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => {
                      nextCard();
                      position.setValue({ x: 0, y: 0 });
                    });
                  } else if (
                    translationX < -swipeThreshold ||
                    velocityX < -200
                  ) {
                    // Swiped left - Previous card
                    Animated.timing(position, {
                      toValue: { x: -screenWidth, y: 0 },
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => {
                      prevCard();
                      position.setValue({ x: 0, y: 0 });
                    });
                  } else {
                    // Not swiped far enough, reset position
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
                  styles.swipeableCard,
                  {
                    transform: [
                      { translateX: position.x },
                      { rotate: rotateCard },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.fullCard}
                  activeOpacity={0.9}
                  onPress={flipCard}
                >
                  <Text style={styles.cardText}>
                    {isFlipped ? currentCard.back : currentCard.front}
                  </Text>
                  {isFlipped && currentCard.example && (
                    <Text style={styles.exampleText}>
                      Example: {currentCard.example}
                    </Text>
                  )}
                  <Text style={styles.flipHint}>Tap to flip</Text>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      navigation.navigate("EditCard", {
                        deckId: deck.id,
                        cardIndex: currentCardIndex,
                      })
                    }
                  >
                    <Ionicons name="pencil" size={24} color="#2196F3" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={deleteCurrentCard}
                  >
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            </PanGestureHandler>
          )}
        </View>

        <Text style={styles.counter}>
          Card {currentCardIndex + 1} of{" "}
          {studyMode ? cardsToReview.length : cards.length}
        </Text>

        {!studyMode ? (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                styles.studyButton,
                styles.fullWidthButton,
              ]}
              onPress={startStudyMode}
            >
              <Text style={styles.buttonText}>Start Studying</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, styles.fullWidthButton]}
            onPress={() => {
              setStudyMode(false);
              setCardsToReview([]);
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
          >
            <Text style={styles.buttonText}>Exit Study Mode</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default FlashcardScreen;
