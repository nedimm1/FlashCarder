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
} from "react-native";

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
      <Text style={styles.headerText}>Language Flashcards</Text>
      <Text style={styles.subHeaderText}>Select a Deck</Text>

      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        style={styles.deckList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deckItem}
            onPress={() =>
              navigation.navigate("Flashcards", { deckId: item.id })
            }
          >
            <Text style={styles.deckTitle}>{item.title}</Text>
            <Text style={styles.deckSubtitle}>
              {item.language} • {item.cards.length} cards
            </Text>
          </TouchableOpacity>
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

  // Find the current deck
  const deck = decks.find((d) => d.id === deckId);
  const cards = deck ? deck.cards : [];

  // Handle empty deck case
  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerText}>{deck.title}</Text>
        <Text style={styles.emptyDeckText}>This deck has no cards yet.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
        >
          <Text style={styles.buttonText}>Add Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back to Decks</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentCardIndex];

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prevIndex) =>
      prevIndex === cards.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prevIndex) =>
      prevIndex === 0 ? cards.length - 1 : prevIndex - 1
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{deck.title}</Text>
        <Text style={styles.subHeaderText}>{deck.language}</Text>
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
        Card {currentCardIndex + 1} of {cards.length}
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.addCardButton]}
          onPress={() => navigation.navigate("AddCard", { deckId: deck.id })}
        >
          <Text style={styles.buttonText}>Add Card</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back to Decks</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
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
      <Text style={styles.headerText}>Add New Card</Text>
      <Text style={styles.subHeaderText}>to {deck.title}</Text>

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

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Cancel</Text>
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
  );
}

// Expanded styles
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
    marginVertical: 10,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#666",
  },
  addCardButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#999",
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
  deckList: {
    width: "100%",
    marginVertical: 20,
  },
  deckItem: {
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  emptyDeckText: {
    fontSize: 18,
    color: "#666",
    marginVertical: 30,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    color: "#333",
  },
  actionButtons: {
    width: "100%",
    marginTop: 10,
  },
});
