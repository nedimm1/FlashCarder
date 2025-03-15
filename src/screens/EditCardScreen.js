import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
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

  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [example, setExample] = useState(card.example || "");

  const saveChanges = () => {
    if (front.trim() && back.trim()) {
      // Create a copy of the current deck
      const updatedDeck = { ...deck };

      // Update the card
      updatedDeck.cards[cardIndex] = {
        ...card,
        front: front.trim(),
        back: back.trim(),
        example: example.trim() || null,
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
    <SafeAreaView style={styles.container}>
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
          onChangeText={setFront}
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
        <TextInput
          style={[
            styles.input,
            { color: "#fff", height: 100, textAlignVertical: "top" },
          ]}
          value={back}
          onChangeText={setBack}
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
          onPress={saveChanges}
        >
          <Text style={styles.addButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default EditCardScreen;
