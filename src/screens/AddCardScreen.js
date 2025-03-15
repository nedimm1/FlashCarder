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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/styles";
import { DataContext } from "../context/DataContext";

function AddCardScreen({ route, navigation }) {
  const { deckId } = route.params;
  const { decks, updateDecks } = React.useContext(DataContext);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [example, setExample] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationDirection, setTranslationDirection] = useState(null);

  // Find the current deck
  const deckIndex = decks.findIndex((d) => d.id === deckId);
  const deck = decks[deckIndex];

  const addCard = () => {
    if (front.trim() && back.trim()) {
      const newCard = {
        id: Date.now().toString(),
        front: front,
        back: back,
        example: example.trim() || null,
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

      // Reset form fields only
      setFront("");
      setBack("");
      setExample("");
      setTranslationDirection(null);

      // Show success message
      Alert.alert("Success", "Card added successfully!");
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
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerText}>Add New Card</Text>
          <Text style={styles.subHeaderText}>to {deck.title}</Text>
        </View>
      </View>

      <View style={styles.autoFeaturesContainer}>
        <View style={styles.autoFeatureRow}>
          <Text style={[styles.inputLabel, { color: "#fff", marginBottom: 0 }]}>
            Auto-translate
          </Text>
          <Switch
            value={autoTranslate}
            onValueChange={(value) => {
              setAutoTranslate(value);
              setTranslationDirection(null);
            }}
            trackColor={{ false: "#444", true: "#4CAF50" }}
            thumbColor={autoTranslate ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text
          style={[
            styles.inputLabel,
            { color: "#fff", marginBottom: 5, fontSize: 16 },
          ]}
        >
          Front ({deck.language})
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: "#fff", height: 100, textAlignVertical: "top" },
          ]}
          value={front}
          onChangeText={(text) => {
            setFront(text);
            if (autoTranslate && text.trim()) {
              setTranslationDirection("toEnglish");
            }
          }}
          placeholder={`Enter front text (${deck.language})`}
          placeholderTextColor="#666"
          multiline={true}
          numberOfLines={4}
        />

        <Text
          style={[
            styles.inputLabel,
            { color: "#fff", marginBottom: 5, marginTop: 15, fontSize: 16 },
          ]}
        >
          Back (English)
        </Text>
        {isTranslating && (
          <Text style={styles.translatingText}>Translating...</Text>
        )}
        <TextInput
          style={[
            styles.input,
            { color: "#fff", height: 100, textAlignVertical: "top" },
          ]}
          value={back}
          onChangeText={(text) => {
            setBack(text);
            if (autoTranslate && text.trim()) {
              setTranslationDirection("toTarget");
            }
          }}
          placeholder="Enter back text (English)"
          placeholderTextColor="#666"
          multiline={true}
          numberOfLines={4}
        />

        <Text
          style={[
            styles.inputLabel,
            { color: "#fff", marginBottom: 5, marginTop: 15, fontSize: 16 },
          ]}
        >
          Example (Optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: "#fff", height: 100, textAlignVertical: "top" },
          ]}
          value={example}
          onChangeText={setExample}
          placeholder="Enter an example sentence (optional)"
          placeholderTextColor="#666"
          multiline={true}
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.addButton, { marginTop: 20 }]}
          onPress={addCard}
        >
          <Text style={styles.addButtonText}>Add Card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default AddCardScreen;
