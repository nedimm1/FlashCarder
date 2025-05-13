import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/styles";
import { DataContext } from "../context/DataContext";

function EditCardScreen({ route, navigation }) {
  const { deckId, cardIndex } = route.params;
  const { decks, updateDecks } = React.useContext(DataContext);

  // Find the current deck and card
  const deck = decks.find((d) => d.id === deckId);
  const card = deck.cards[cardIndex];

  // If the card was created with isEnglishFirst, we need to swap the initial values
  const isCardEnglishFirst = card.isEnglishFirst || false;
  const [front, setFront] = useState(
    isCardEnglishFirst ? card.back : card.front
  );
  const [back, setBack] = useState(isCardEnglishFirst ? card.front : card.back);
  const [example, setExample] = useState(card.example || "");
  const [pronunciation, setPronunciation] = useState(card.pronunciation || "");
  const [isEnglishFirst, setIsEnglishFirst] = useState(isCardEnglishFirst);

  const saveChanges = () => {
    if (front.trim() && back.trim()) {
      // Create a copy of the current deck
      const updatedDeck = { ...deck };

      // Update the card, swapping front/back if English is first
      updatedDeck.cards[cardIndex] = {
        ...card,
        front: isEnglishFirst ? back : front,
        back: isEnglishFirst ? front : back,
        example: example.trim() || null,
        pronunciation: pronunciation.trim() || null,
        isEnglishFirst: isEnglishFirst,
      };

      // Update the decks array
      const updatedDecks = decks.map((d) =>
        d.id === deckId ? updatedDeck : d
      );

      // Update the global state
      updateDecks(updatedDecks);

      // Show success message and navigate back
      Alert.alert("Success", "Card updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert("Error", "Please fill in both sides of the card");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#1a1a1a" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={editCardStyles.scrollContent}
        >
          <View style={styles.headerWithBack}>
            <TouchableOpacity
              style={styles.backArrow}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerText}>Edit Card</Text>
              <Text style={styles.subHeaderText}>in {deck.title}</Text>
            </View>
          </View>

          <View style={editCardStyles.content}>
            <View style={editCardStyles.switchContainer}>
              <Text style={editCardStyles.switchLabel}>
                Show English on front
              </Text>
              <Switch
                value={isEnglishFirst}
                onValueChange={setIsEnglishFirst}
                trackColor={{ false: "#444", true: "#4CAF50" }}
                thumbColor={isEnglishFirst ? "#fff" : "#f4f3f4"}
              />
            </View>

            <Text style={editCardStyles.label}>
              {isEnglishFirst ? "Back" : "Front"} ({deck.displayName})
            </Text>
            <TextInput
              style={editCardStyles.input}
              value={front}
              onChangeText={setFront}
              placeholder={`Enter ${isEnglishFirst ? "back" : "front"} text (${
                deck.displayName
              })`}
              placeholderTextColor="#666"
              multiline={true}
              numberOfLines={4}
            />

            <Text style={[editCardStyles.label, { marginTop: 15 }]}>
              {isEnglishFirst ? "Front" : "Back"} (English)
            </Text>
            <TextInput
              style={editCardStyles.input}
              value={back}
              onChangeText={setBack}
              placeholder={`Enter ${
                isEnglishFirst ? "front" : "back"
              } text (English)`}
              placeholderTextColor="#666"
              multiline={true}
              numberOfLines={4}
            />

            <Text style={[editCardStyles.label, { marginTop: 15 }]}>
              Pronunciation (Optional)
            </Text>
            <TextInput
              style={editCardStyles.input}
              value={pronunciation}
              onChangeText={setPronunciation}
              placeholder="Enter pronunciation"
              placeholderTextColor="#666"
              multiline={true}
              numberOfLines={2}
            />

            <Text style={[editCardStyles.label, { marginTop: 15 }]}>
              Example (Optional)
            </Text>
            <TextInput
              style={editCardStyles.input}
              value={example}
              onChangeText={setExample}
              placeholder="Enter an example sentence (optional)"
              placeholderTextColor="#666"
              multiline={true}
              numberOfLines={4}
            />

            <TouchableOpacity
              style={editCardStyles.saveButton}
              onPress={saveChanges}
            >
              <Text style={editCardStyles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const editCardStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    fontSize: 16,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default EditCardScreen;
