import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";

// Sample data - will be used only on first launch
const initialDecks = [
  {
    id: "1",
    title: "Spanish Basics",
    language: "Spanish",
    cards: [
      { id: "1", front: "Hello", back: "Hola", language: "Spanish" },
      { id: "2", front: "Goodbye", back: "Adiós", language: "Spanish" },
      { id: "3", front: "Thank you", back: "Gracias", language: "Spanish" },
      { id: "4", front: "Please", back: "Por favor", language: "Spanish" },
    ],
  },
  {
    id: "2",
    title: "French Basics",
    language: "French",
    cards: [
      { id: "1", front: "Hello", back: "Bonjour", language: "French" },
      { id: "2", front: "Goodbye", back: "Au revoir", language: "French" },
      { id: "3", front: "Thank you", back: "Merci", language: "French" },
    ],
  },
];

// Data storage keys
const STORAGE_KEY = "flashcards_data";

// Data management functions
const saveData = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving data:", error);
    Alert.alert("Error", "Failed to save your data");
  }
};

const loadData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : initialDecks;
  } catch (error) {
    console.error("Error loading data:", error);
    Alert.alert("Error", "Failed to load your data");
    return initialDecks;
  }
};

// Create the stack navigator
const Stack = createNativeStackNavigator();

// Context for sharing data between screens
const DataContext = React.createContext();

// Home Screen - Deck Selection
function HomeScreen({ navigation }) {
  const { decks, updateDecks } = React.useContext(DataContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckLanguage, setNewDeckLanguage] = useState("");

  const addNewDeck = () => {
    if (newDeckTitle.trim() && newDeckLanguage.trim()) {
      const newDeck = {
        id: Date.now().toString(),
        title: newDeckTitle,
        language: newDeckLanguage,
        cards: [],
      };
      const updatedDecks = [...decks, newDeck];
      updateDecks(updatedDecks);
      setNewDeckTitle("");
      setNewDeckLanguage("");
      setModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Language Flashcards</Text>
      </View>
      <Text style={styles.subHeaderText}>Select a Deck</Text>

      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        style={styles.deckList}
        renderItem={({ item }) => (
          <View style={styles.deckItemContainer}>
            <TouchableOpacity
              style={styles.deckItem}
              onPress={() =>
                navigation.navigate("Flashcards", { deckId: item.id })
              }
            >
              <View style={styles.deckContent}>
                <Text style={styles.deckTitle}>{item.title}</Text>
                <Text style={styles.deckSubtitle}>
                  {item.language} • {item.cards.length} cards
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deckDeleteButton}
              onPress={() => {
                Alert.alert(
                  "Delete Deck",
                  `Are you sure you want to delete "${item.title}"?`,
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        const updatedDecks = decks.filter(
                          (d) => d.id !== item.id
                        );
                        updateDecks(updatedDecks);
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add New Deck</Text>
      </TouchableOpacity>

      {/* Modal for adding new deck */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Deck</Text>

            <TextInput
              style={styles.input}
              placeholder="Deck Title"
              value={newDeckTitle}
              onChangeText={setNewDeckTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Language"
              value={newDeckLanguage}
              onChangeText={setNewDeckLanguage}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={addNewDeck}>
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

// Flashcard Screen
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
  const swipeThreshold = 120;
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
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>{deck.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
          >
            <Ionicons name="add" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.emptyDeckText}>This deck has no cards yet.</Text>

        <View style={styles.emptyDeckButtons}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
          >
            <Text style={styles.buttonText}>Add Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => {
              const updatedDecks = decks.filter((d) => d.id !== deckId);
              updateDecks(updatedDecks);
              navigation.goBack();
            }}
          >
            <Text style={styles.buttonText}>Delete Deck</Text>
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
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>{deck.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
          >
            <Ionicons name="add" size={24} color="#333" />
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
    // If the card was previously marked as incorrect, decrease the incorrect count
    if (cardStatuses[currentCard.id] === "incorrect") {
      // Update card status from incorrect to correct
      setCardStatuses({
        ...cardStatuses,
        [currentCard.id]: "correct",
      });
    } else {
      // Just mark as correct if it wasn't marked before
      setCardStatuses({
        ...cardStatuses,
        [currentCard.id]: "correct",
      });
    }

    // In study mode, remove the card from cards to review
    if (studyMode) {
      const updatedCardsToReview = [...cardsToReview];
      updatedCardsToReview.splice(currentCardIndex, 1);
      setCardsToReview(updatedCardsToReview);

      // Adjust current index if needed
      if (currentCardIndex >= updatedCardsToReview.length) {
        setCurrentCardIndex(Math.max(0, updatedCardsToReview.length - 1));
      }

      setIsFlipped(false);
    } else {
      // In regular mode, just go to next card
      nextCard();
    }
  };

  const handleDidntGetIt = () => {
    // Update card status to incorrect if not already
    if (cardStatuses[currentCard.id] !== "incorrect") {
      setCardStatuses({
        ...cardStatuses,
        [currentCard.id]: "incorrect",
      });
    }

    if (studyMode) {
      // Move current card to the end of the review list
      const updatedCardsToReview = [...cardsToReview];
      const currentCardToMove = updatedCardsToReview.splice(
        currentCardIndex,
        1
      )[0];
      updatedCardsToReview.push(currentCardToMove);
      setCardsToReview(updatedCardsToReview);

      // Go to next card (which is now at the current index after removing the current card)
      setIsFlipped(false);

      // If we're at the end, go back to the beginning
      if (currentCardIndex >= updatedCardsToReview.length) {
        setCurrentCardIndex(0);
      }
    } else {
      // In regular mode, just go to next card
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

          // Update the state and save to storage
          updateDecks(updatedDecks);

          // If we deleted the last card, go to the previous card
          if (currentCardIndex >= updatedDeck.cards.length) {
            setCurrentCardIndex(Math.max(0, updatedDeck.cards.length - 1));
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

    // Initialize card statuses based on existing statuses
    const initialStatuses = {};
    cards.forEach((card) => {
      // Preserve existing statuses if any
      initialStatuses[card.id] = cardStatuses[card.id] || null;
    });
    setCardStatuses(initialStatuses);
  };

  // Handle gesture state change
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: position.x } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;

      // Determine if the card was swiped far enough
      if (translationX > swipeThreshold) {
        // Swiped right - Got it right
        Animated.timing(position, {
          toValue: { x: screenWidth, y: 0 },
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          handleGotIt();
          position.setValue({ x: 0, y: 0 });
        });
      } else if (translationX < -swipeThreshold) {
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
            <Ionicons name="arrow-back" size={24} color="#333" />
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
            <Ionicons name="add" size={24} color="#333" />
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
                  <Text style={styles.flipHint}>Tap to flip</Text>

                  <TouchableOpacity
                    style={styles.deleteCardIcon}
                    onPress={deleteCurrentCard}
                  >
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  </TouchableOpacity>

                  {/* Arrows inside the card */}
                  <TouchableOpacity
                    style={[styles.arrowButton, styles.leftArrow]}
                    onPress={handleDidntGetIt}
                  >
                    <Ionicons
                      name="arrow-back-circle"
                      size={40}
                      color="#FF3B30"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.arrowButton, styles.rightArrow]}
                    onPress={handleGotIt}
                  >
                    <Ionicons
                      name="arrow-forward-circle"
                      size={40}
                      color="#4CAF50"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            </PanGestureHandler>
          ) : (
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={(event) => {
                if (event.nativeEvent.oldState === State.ACTIVE) {
                  const { translationX } = event.nativeEvent;

                  // Determine if the card was swiped far enough
                  if (translationX > swipeThreshold) {
                    // Swiped right - Next card
                    Animated.timing(position, {
                      toValue: { x: screenWidth, y: 0 },
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => {
                      nextCard();
                      position.setValue({ x: 0, y: 0 });
                    });
                  } else if (translationX < -swipeThreshold) {
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
                  <Text style={styles.flipHint}>Tap to flip</Text>

                  <TouchableOpacity
                    style={styles.deleteCardIcon}
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
          <TouchableOpacity
            style={[styles.button, styles.studyButton, styles.fullWidthButton]}
            onPress={startStudyMode}
          >
            <Text style={styles.buttonText}>Start Studying</Text>
          </TouchableOpacity>
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

        <StatusBar style="auto" />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// Add Card Screen
function AddCardScreen({ route, navigation }) {
  const { deckId } = route.params;
  const { decks, updateDecks } = React.useContext(DataContext);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  // Find the current deck
  const deckIndex = decks.findIndex((d) => d.id === deckId);
  const deck = decks[deckIndex];

  const addCard = () => {
    if (front.trim() && back.trim()) {
      const newCard = {
        id: Date.now().toString(),
        front: front,
        back: back,
        language: deck.language,
      };

      // Create a new deck object with the updated cards
      const updatedDeck = {
        ...deck,
        cards: [...deck.cards, newCard],
      };

      // Create a new decks array with the updated deck
      const updatedDecks = [...decks];
      updatedDecks[deckIndex] = updatedDeck;

      // Update the global state
      updateDecks(updatedDecks);

      // Reset form and navigate back
      setFront("");
      setBack("");
      navigation.goBack();
    } else {
      Alert.alert("Error", "Please fill in both sides of the card");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerText}>Add New Card</Text>
          <Text style={styles.subHeaderText}>to {deck.title}</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Front (Question/Word)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter the word or phrase"
          value={front}
          onChangeText={setFront}
          multiline
        />

        <Text style={styles.label}>Back (Answer/Translation)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter the translation"
          value={back}
          onChangeText={setBack}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={addCard}>
          <Text style={styles.buttonText}>Add Card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Main App Component
export default function App() {
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on app start
  useEffect(() => {
    const fetchData = async () => {
      const data = await loadData();
      setDecks(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Save data whenever decks change
  const updateDecks = (newDecks) => {
    setDecks(newDecks);
    saveData(newDecks);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DataContext.Provider value={{ decks, updateDecks }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Flashcards"
              component={FlashcardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddCard"
              component={AddCardScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </DataContext.Provider>
    </GestureHandlerRootView>
  );
}

// Expanded styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  // Home screen header
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subHeaderText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  deckList: {
    width: "100%",
    marginVertical: 20,
  },
  deckItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deckItem: {
    flex: 1,
  },
  deckContent: {
    flexDirection: "column",
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  deckSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  deckDeleteButton: {
    padding: 10,
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
    height: 400, // Fixed height for the card container
  },
  swipeableCard: {
    width: "100%",
    height: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  fullCard: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "white",
    position: "relative",
  },
  cardText: {
    fontSize: 28,
    textAlign: "center",
    color: "#333",
    fontWeight: "500",
    maxWidth: "90%",
  },
  flipHint: {
    position: "absolute",
    bottom: 20,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  deleteCardIcon: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
  },
  swipeHints: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 15,
    marginTop: 5,
  },
  swipeHintLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  swipeHintRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  swipeHintText: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 5,
    flexShrink: 1,
  },
  counter: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  fullWidthButton: {
    width: "100%",
  },
  studyButton: {
    backgroundColor: "#4CAF50",
  },
  resetButton: {
    backgroundColor: "#4CAF50",
    marginTop: 20,
  },
  backButton: {
    backgroundColor: "#666",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  addCardButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  optionsButton: {
    backgroundColor: "#FF9500",
  },
  emptyDeckText: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginVertical: 30,
  },
  emptyDeckButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  completionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  completionText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
  },
  completionSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  studyControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  correctButton: {
    backgroundColor: "#4CAF50",
    width: "45%",
  },
  incorrectButton: {
    backgroundColor: "#FF3B30",
    width: "45%",
  },
  studyStats: {
    marginTop: 5,
    marginBottom: 10,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
    width: "100%",
  },
  studyCounter: {
    fontSize: 16,
    color: "#666",
  },
  correctStat: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  incorrectStat: {
    color: "#FF3B30",
    fontWeight: "bold",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  optionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  stackedButtons: {
    width: "100%",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: "100%",
  },
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  // Flashcard screen header
  headerWithBack: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backArrow: {
    padding: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  arrowButton: {
    position: "absolute",
    zIndex: 10,
    padding: 10,
    bottom: "50%",
  },
  leftArrow: {
    left: 5,
  },
  rightArrow: {
    right: 5,
  },
});
