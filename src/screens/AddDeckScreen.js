import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { DataContext } from "../context/DataContext";

export const AddDeckScreen = ({ navigation }) => {
  const [deckName, setDeckName] = useState("");
  const { decks, updateDecks } = useContext(DataContext);

  const handleAddDeck = () => {
    if (!deckName.trim()) {
      Alert.alert("Error", "Please enter a deck name");
      return;
    }

    const newDeck = {
      name: deckName.trim(),
      cards: [],
    };

    updateDecks([...decks, newDeck]);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Deck</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter deck name"
        value={deckName}
        onChangeText={setDeckName}
        autoFocus
      />
      <TouchableOpacity style={styles.button} onPress={handleAddDeck}>
        <Text style={styles.buttonText}>Create Deck</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
